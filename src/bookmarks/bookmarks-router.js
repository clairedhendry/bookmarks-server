const express = require('express')
const { lists } = require('../store')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { isWebUri } = require('valid-url')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter  
    .route('/bookmarks')
    .get((req, res) => {
        res.send(lists)
    })
    .post(bodyParser, (req, res) => {
        const { title, rating, url, description="" } = req.body;
        if(!title) {
            logger.error(`Title is required`);
            return res.status(400).send('Invalid data');
        }
        if(!rating) {
            logger.error(`Rating is required`);
            return res.status(400).send('Invalid data');
        }
        if(!isWebUri(url)) {
            logger.error(`${url} is not valid.`)
            return res.status(400).send('Invalid url')
        }
        
        const id = uuid();
        const bookmark = {
            id,
            title,
            rating,
            url,
            description
        };
        lists.push(bookmark);
             logger.info(`Bookmark with id ${id} created`);
    
        res 
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmark)
        })

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
        const bookmark = lists.find(item => item.id == id);
        if(!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res.status(404).send('Bookmark Not Found');
        }
        res.json(bookmark)
        })
    .delete((req, res) => {
        const { id } = req.params;
        const bookmarkIndex = lists.findIndex(item => item.id == id);
        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Not found');
        }
        lists.splice(bookmarkIndex, 1);
        logger.info(`Bookmark with id ${id} deleted.`);
        res
            .status(204)
            .end();
    })

    module.exports = bookmarksRouter