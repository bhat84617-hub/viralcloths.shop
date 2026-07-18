const express = require('express');
const router = express.Router();
const {
  getPageMeta, getProductSeo, getCategorySeo,
  getSitemapXml, getSitemapHtml, getRobotsTxt, getManifest
} = require('../controllers/seoController');

router.get('/page', getPageMeta);
router.get('/product', getProductSeo);
router.get('/category', getCategorySeo);
router.get('/sitemap.xml', getSitemapXml);
router.get('/sitemap.html', getSitemapHtml);

module.exports = router;
