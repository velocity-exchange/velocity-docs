import fs from 'fs';

const pages = [
    {
        file: '../content/protocol/legal-and-regulations/terms-of-use.mdx',
        s3Url: process.env.NEXT_PUBLIC_S3_URL_TERMS_OF_USE
    },
    {
        file: '../content/protocol/legal-and-regulations/privacy-policy.mdx',
        s3Url: process.env.NEXT_PUBLIC_S3_URL_PRIVACY_POLICY
    }
]

const replacePageContentFromS3 = async (filename: string, s3Url: string) => {
    const s3Text = await fetch(s3Url).then(res => res.text());
    const filePath = __dirname + filename;
    const fileText = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, fileText.replace(/__PAGE_CONTENT__/g, s3Text), 'utf8');
};

const replaceAllLegalPageContent = async () => {
    await Promise.all(pages.map(page => replacePageContentFromS3(page.file, page.s3Url || '')));
}

replaceAllLegalPageContent().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
