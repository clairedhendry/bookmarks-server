const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks')
    },
    
    getBookmarkById(knex, bookmarkId) {
        return knex
            .from('bookmarks')
            .select('*')
            .where( 'id', bookmarkId )
            .first()
    },

    updateBookmarkById() {
        console.log('bookmark updated')
    },

    deleteBookmarkById(knex, id) {
        return knex
            .where({id})
            .delete()
        
    },

    postNewBookmark(knex, newBookmark) {
        return knex 
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(row => {return row[0]})
    }
  
}

module.exports = BookmarksService