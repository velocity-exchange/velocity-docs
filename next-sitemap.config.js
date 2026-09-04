/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // TODO(open-question): provisional hosted URL, confirm final docs domain.
  siteUrl: 'https://docs.velocity.exchange',
  generateRobotsTxt: true,
  // The generated share-card images are one route per page. They are not pages,
  // so they stay out of the sitemap and out of the index.
  exclude: ['/og', '/og/*'],
}