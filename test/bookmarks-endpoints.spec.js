require('dotenv').config()
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe(`Bookmarks endpoints`, () => {

    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`GET /bookmarks `, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
        
             beforeEach('insert bookmarks', () => {
               return db
                 .into('bookmarks')
                 .insert(testBookmarks)
             })

             it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                 return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
             })
        })

        context('Given there are no bookmarks in the database', () => {
            it('responds with 200 and empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })

        context(`Given an XSS attack article`, () => {
            const maliciousBookmark = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: 'www.badsite',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: '5'
            }
            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        })

    })

    describe(`GET /bookmarks/:id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
            beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(testBookmarks)
              })
            
              it('Get /bookmarks/:id responds with 200 and correct bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
              })

              })

            
            context('Given there are no bookmarks in the database', () => {
                    it(`responds with 404`, () => {
                        const bookmarkId = 123456
                        return supertest(app)
                            .get(`/bookmarks/${bookmarkId}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(404, {error: { message: `Bookmark doesn't exist`}})
                    })
                })  
        })


    describe(`POST /bookmarks`, () => {
            it('creates a new bookmark, responding with 201 and the new bookmark', () => {
                
                const newBookmark = {
                    title: 'Test new bookmark',
                    url: 'www.newbookmark.com',
                    description: 'New bookmark content',
                    rating: '5'
                }

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBookmark.title)
                        expect(res.body.url).to.eql(newBookmark.url)
                        expect(res.body.description).to.eql(newBookmark.description)
                        expect(res.body).to.have.property('id')
                        expect(res.body.rating).to.eql(newBookmark.rating)
                        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                    })
                    .then(postRes => 
                        supertest(app)
                            .get(`/bookmarks/${postRes.body.id}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(postRes.body)
                    )
            })
            const requiredFields = ['title', 'url', 'rating']
        
           requiredFields.forEach(field => {
             const newBookmark = {
               title: 'Test new bookmark',
               url: 'http://www.clairedhendry.com',
               rating: '5'
             }
        
             it(`responds with 400 and an error message when the '${field}' is missing`, () => {
               delete newBookmark[field]
        
               return supertest(app)
                 .post('/bookmarks')
                 .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                 .send(newBookmark)
                 .expect(400, {
                   error: { message: `Missing '${field}' in request body` }
                 })
             })
           })
        })
    

})