// Chặn build gói Store khi chưa điền danh tính lấy từ Partner Center (Product identity)
const { appx } = require('../package.json').build;
const missing = ['identityName', 'publisher', 'publisherDisplayName'].filter((k) => !appx[k] || appx[k].includes('DIEN-TU-PARTNER-CENTER'));
if (missing.length) {
  console.error('Chưa điền build.appx.' + missing.join(', build.appx.') + ' trong package.json.\n'
    + 'Lấy ở Partner Center → ứng dụng Vân Quẻ → Product management → Product identity:\n'
    + '  Package/Identity/Name → identityName, Package/Identity/Publisher → publisher, Package/Properties/PublisherDisplayName → publisherDisplayName');
  process.exit(1);
}
