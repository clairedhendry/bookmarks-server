const express = require('express')
const { v4: uuid } = require('uuid')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const BookmarksService = require('../BookmarksService')
const BookmarksRouter = express.Router()
const xss = require('xss')
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
})


BookmarksRouter  
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
          .then(bookmarks => {
            res.json(bookmarks.map(serializeBookmark))
          })
          .catch(next)
      })
    .post(bodyParser, (req, res, next) => {

        for(const field of ['title', 'url', 'rating']) {
          if(!req.body[field]) {
            logger.error(`'${field}' is required`)
            return res.status(400).send({
              error: {message: `'${field}' is required`}
            })
          }
        }

        const { title, rating, url, description } = req.body;
        
     

        const ratingNum = Number(rating)

    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send({
        error: { message: `'rating' must be a number between 0 and 5` }
      })
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send({
        error: { message: `'url' must be a valid URL` }
      })
    }

        for (const [key, value] of Object.entries(newBookmark)) {
          if (value == null) {
            return res.status(400).json({
              error: { message: `Missing '${key}' in request body` }
            })
          }
        }

        const newBookmark = {title, url, description, rating}
        
        BookmarksService.postNewBookmark(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            res
              .status(201)
              .location(`/bookmarks/${bookmark.id}`)
              .json(serializeBookmark(bookmark))
          })
          .catch(next)
        })

BookmarksRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
      BookmarksService.getBookmarkById(
        req.app.get('db'),
        req.params.id
      )
      .then(bookmark => {
        if(!bookmark) {
          logger.error(`Bookmark with id ${req.params.id} does not exist`)
          return res.status(404).json({
            error: {message: `Bookmark doesn't exist`}
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmarkById(
          req.app.get('db'),
          req.params.id
        )
        .then(() => {
          logger.info(`Bookmark with id ${req.params.id} deleted`)
          res.status(204).end()
        })
        .catch(next)
    })

    module.exports = BookmarksRouter