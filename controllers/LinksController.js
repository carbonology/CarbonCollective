const express = require('express');
const router = express.Router();
const verify = require('../services/Auth');
const ImageService = require('../services/ImageService');
const jwt = require('jsonwebtoken');

const Link = require('../models/Link');
const slugify = require('slugify');

const jwtKey = require('../private/keys.json');
// Fetch All
router.get('/', (req, res) => {
  Link.find().sort({dateAdded: -1}).limit(25).then(links => {
    res.status(200).send(links);
  });
});

// Create new
router.post('/', verify, (req, res) => {
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if (err) {
      return res.status(403).send({"error": "User not authorized."});
    }
  });

  const { title, url, tags, description, opinion, source, related } = req.body;
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
        imageUrl
      }).then(data => {
        return res.status(200).send({
          "success": data
        });
      }).catch(err => {
        console.log(err);
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
  console.log(term);
  Link.find({$or: [{ title: term  }, {description: term}, {url: term}, {source: term}, {tags: term}]})
  .then(data => {
    console.log(data);
    return res.status(200).send({data});
  })
  .catch(err => {
    return res.status(500).send({"error": "Search error"})
  });
});

module.exports = router;