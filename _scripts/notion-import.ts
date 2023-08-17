/***
 Thanks to @aymanbagabas for the original script:
 https://github.com/aymanbagabas/aymanbagabas.github.io/blob/abd711ed3033a9416b7fedd5c3561a896ae13888/_scripts/notion-import.js

 I'm adding new parsing for blocks so they align with the way jekyll-theme-chripy works
 ***/

const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath })


console.log(process.env.TEST);

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

(async () => {
    // ensure directory exists
    const root = path.join('_posts', 'notion')
    fs.mkdirSync(root, { recursive: true })

    const databaseId = process.env.DATABASE_ID;
    // TODO has_more
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "Publish",
            checkbox: {
                equals: true
            }
        }
    })


    for (const r of response.results) {
        console.log(Object.keys(r.properties))
        const id = r.id
        // let fmData = { id, date, title, tags }
        // date
        let date = moment(r.created_time).format("YYYY-MM-DD")
        let pdate = r.properties?.['Date']?.['date']?.['start']
        if (pdate) {
            date = moment(pdate).format('YYYY-MM-DD')
        }
        console.log(date);
        // title
        let title = id
        let ptitle = r.properties?.['Post']?.['title']
        // console.log(JSON.parse(r.properties));
        if (ptitle?.length > 0) {
            title = ptitle[0]?.['plain_text']

        }
        // tags
        let tags = []
        let ptags = r.properties?.['Tags']?.['multi_select']
        for (const t of ptags) {
            const n = t?.['name']
            if (n) {
                tags.push(n)
            }
        }
        // // categories
        // let cats = []
        // let pcats = r.properties?.['Categories']?.['multi_select']
        // for (const t of pcats) {
        //     const n = t?.['name']
        //     if (n) {
        //         tags.push(n)
        //     }
        // }
        // // comments
        // const comments = r.properties?.['No Comments']?.['checkbox'] == false
        // // frontmatter
        // let fmtags = ''
        // let fmcats = ''
        // if (tags.length > 0) {
        //     fmtags += '\ntags:\n'
        //     for (const t of tags) {
        //         fmtags += '  - ' + t + '\n'
        //     }
        // }
        // if (cats.length > 0) {
        //     fmcats += '\ncategories:\n'
        //     for (const t of cats) {
        //         fmcats += '  - ' + t + '\n'
        //     }
        // }
        const fm = `---
 layout: post
 date: ${date}
 title: ${title}
 tags: ${tags.toString()}
 ---
 `
        //comments: ${comments}


        const mdblocks = await n2m.pageToMarkdown(id);
        const md = n2m.toMarkdownString(mdblocks);

        //writing to file
        const ftitle = `${date}-${title.replaceAll(' ', '-').toLowerCase()}.md`
        fs.writeFile(path.join(root, ftitle), fm + md, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
})();
