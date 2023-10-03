/***
 Thanks to @aymanbagabas for the original script:
 https://github.com/aymanbagabas/aymanbagabas.github.io/blob/abd711ed3033a9416b7fedd5c3561a896ae13888/_scripts/notion-import.js

 I'm adding new parsing for blocks so they align with the way jekyll-theme-chripy works
 ***/

const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const https = require('https');
const lqip = require('lqip');
const { VideoTransformer, ImageTransformer } = require('./transformers');

const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion, config: {} });

n2m.setCustomTransformer('video', VideoTransformer);
n2m.setCustomTransformer(`image`, (block) => ImageTransformer(block, notion));

function createFrontMatter(fmData) {
  const { id, title, date, tags, pinned, category } = fmData;
  // console.log(fmData.cover_lqip)
  let fm = '---\n';
  fm += `id: ${id}\n`;
  fm += `title: ${title}\n`;
  fm += `date: ${date}\n`;
  fm += `tags: ${tags}\n`;
  fm += `category: ${category}\n`;
  fm += `pin: ${pinned}\n`;
  fm += `img_path: ${fmData.img_path}\n`;
  fm += '---\n';
  return fm;
}

async function WriteMdToFile(resData, root) {
  const mdblocks = await n2m.pageToMarkdown(resData.id);

  const md = n2m.toMarkdownString(mdblocks).parent;
  let fm = createFrontMatter(resData);

  // writing to file
  const fileTitle = `${resData.date}-${resData.title
    .replaceAll(' ', '-')
    .toLowerCase()}.md`;
  fs.writeFile(path.join(root, fileTitle), fm + md, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

(async () => {
  // ensure directory exists
  const root = path.join('_posts', 'notion');
  clearDirectory(root);
  fs.mkdirSync(root, { recursive: true });
  const databaseId = process.env.DATABASE_ID;
  // TODO has_more
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Publish',
      checkbox: {
        equals: true,
      },
    },
  });

  for (const r of response.results) {
    if (r.archived) return;
    // console.log("Response: ", r)
    // console.log(Object.keys(r.properties))
    let resData = PostResponseDataFactory(r);
    // console.log("Post Data: ", resData)

    await WriteMdToFile(resData, root);
  }
})();

function PostResponseDataFactory(_res) {
  let id = _res.id;

  let date = moment(_res.created_time).format('YYYY-MM-DD');
  if (_res.properties['Date']) {
    date = moment(_res.properties['Date'].date.start).format('YYYY-MM-DD');
  }

  let title = _res.properties['Title']?.title[0].plain_text;
  // console.log("Title Data: ", _res.properties["Title"])
  // console.log("Title: ", title)

  let tags = [];
  let ptags = _res.properties?.['Tags']?.['multi_select'];

  for (const t of ptags) {
    const n = t?.['name'];
    if (n) {
      tags.push(n);
    }
  }

  let categories = [];
  let pcategories = _res.properties?.['Category']?.['multi_select'];

  for (const t of pcategories) {
    const n = t?.['name'];
    if (n) {
      categories.push(n);
    }
  }

  // console.log("Tag Data: ", _res.properties["Tags"])
  // console.log("Tags: ", tags)

  let pinned = _res.properties['Pinned']?.checkbox;

  let data = {
    id,
    date,
    title,
    tags: '[' + tags.toString() + ']',
    category: '[' + categories.toString() + ']',
    pinned,
    cover_url: null,
    cover_lqip: null,
    img_path: '/' + path.join('assets', 'notion', id).replace(/\\/g, '/') + '/',
  };

  if (_res.cover) {
    let cover = _res.cover;
    let url = cover.type == 'file' ? cover.file.url : cover.external.url;

    let imageDest = downloadCoverImage(id, url);
    // console.log(`Image downloaded and saved to ${imageDest}`)
    data.cover_url = imageDest;

    // lqip.base64(path.resolve(data.cover_url)).then(res => {
    //   data.cover_lqip = res;
    // });
  }

  return data;
}

function clearDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.statSync(filePath).isDirectory()) {
        clearDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }
}

function downloadCoverImage(_postId, _coverUrl) {
  const fileExtension = getFileExtensionFromUrl(_coverUrl) || '.png'; // Default to .png if no extension found
  const imageDest = path.join(
    'assets',
    'notion',
    _postId,
    'cover' + fileExtension
  );
  if (fs.existsSync(imageDest)) {
    return imageDest;
  }
  fs.mkdirSync(path.dirname(imageDest), { recursive: true }); // Ensure the directory exists

  downloadImage(_coverUrl, imageDest)
    .then(() => {
      console.log(`Image downloaded and saved to ${imageDest}`);
    })
    .catch((error) => {
      console.error(`Error downloading image: ${error.message}`);
    });

  return imageDest;
}

function getFileExtensionFromUrl(url) {
  return path.extname(new URL(url).pathname);
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', (error) => {
        fs.unlink(dest);
        reject(error);
      });
  });
}

// interface PostResponseData {
//   id: number;
//   date: string;
//   title: string;
//   tags: string[];
//   publish: boolean;
//   pinned: boolean;
// }
