const express = require('express');
const router = express.Router();
const verify = require('../services/Auth');
const ImageService = require('../services/ImageService');
const jwt = require('jsonwebtoken');
const keys = require('../keys');

const Link = require('../models/Link');
const slugify = require('slugify');

const sendTweet = require('../services/TweetService');

const LINK_RETURN_LIMIT = 25;

// Fetch All
router.get('/all', (req, res) => {
  Link.find()
    .sort({dateAdded: -1})
    .limit(LINK_RETURN_LIMIT)
  .then(links => {
    res.status(200).send(links);
  }).catch(err => {
    res.status(500).send(err);
  });
});

// Pagination
router.get('/all/:page', (req, res) => {
  const num = parseInt(req.params.page);
  const skip = (num * LINK_RETURN_LIMIT) - LINK_RETURN_LIMIT;

  Link.find()
    .skip(skip)
    .sort({dateAdded: -1})
    .limit(LINK_RETURN_LIMIT)
  .then(links => {
    res.status(200).send(links);
  }).catch(err => {
    res.status(500).send(err);
  });
});

// Create new
router.post('/', verify, (req, res) => {
  jwt.verify(req.token, keys.jwtKey, (err, authData) => {
    if (err) {
      return res.status(403).send({"error": "User not authorized."});
    }
  });

  const { title, url, tags, description, opinion, source, related, isPrivate, tweetText } = req.body;
  const slug = slugify(title.toLowerCase());
  const splitTags = () => {
    return tags.split(',');
  }

  (async () => {
    ImageService.sendUploadToGCS(req).then(imageUrl => {
      Link.create({
        title,
        url,
        tags: splitTags(),
        description,
        opinion,
        source,
        related,
        slug,
        imageUrl,
        isPrivate
      }).then(data => {

        if (tweetText !== 'none'){
          sendTweet(tweetText, slug, title, description, req.files);
        }

        return res.status(200).send({
          "success": data
        });
      }).catch(err => {
        return res.status(500).send({ "error": err });
      });
    });
  })();
});

// Fetch one
router.get('/:slug', (req, res) => {
  Link.find({ slug: req.params.slug}).then(data => {
    res.json(data);
  });
});

router.post('/search', (req, res) => {
  const { term } = req.body;

  Link.find({ title: { $regex: '.*' + term + '.*' }}).limit(5)
  .then(data => {
    return res.status(200).send({data});
  })
  .catch(err => {
    return res.status(500).send({"error": err})
  });
});

module.exports = router;
