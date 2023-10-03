function VideoTransformer(block) {
  // console.log(block)
  let { type, external } = block.video;
  let url = external.url;
  let id;
  if (url.includes('youtube')) {
    id = url.split('v=')[1];
  } else if (url.includes('youtu.be')) {
    id = url.split('/')[1];
  }
  return `{% include embed/youtube.html id='${id}' %}`;
}

//if image is a child of a column block, it will be transformed to a right aligned image
async function ImageTransformer(block, notion) {
  // let parent = block.parent;
  // console.log(parent);
  // let res = await notion.blocks.retrieve({ block_id: parent.block_id });
  // if (res.type == 'column') {

  let path = await DownloadImage(block);

  let caption = block.image.caption[0]?.plain_text;
  if (!caption) {
    return `![](${path}){: w='800' .50}`;
  }

  if (caption.includes('[r]') || caption.includes('[right]')) {
    caption = caption.replaceAll('[r]', '').replaceAll('[right]', '');
    return `![](${path}){: w='400' .50 .right}`;
  }

  return `![${caption}](${[path]}){: w='800' .50}\n_${caption}_`;
}

async function DownloadImage(block) {

  // parse notion blockl for url
  let notionFile = block.image;
  let url;
  if (notionFile.type == 'external') {
    url = notionFile.external.url;
  } else if (notionFile.type == 'file') {
    url = notionFile.file.url;
  }

  const blockId = block.id;
  const parentId = block.parent.page_id;

  const https = require('https');
  const fs = require('fs');
  const path = require('path');
  const imageExtension = path.extname(url).split('?')[0];
  let filename = blockId + imageExtension;
  let assetPath = path.join(__dirname, '../assets/notion', parentId, filename);

  // skip if file already exists
  if (fs.existsSync(assetPath)) {
    return filename;
  }

  fs.mkdirSync(path.dirname(assetPath), { recursive: true });

  const file = fs.createWriteStream(assetPath);
  const request = https.get(url, function (response) {
    response.pipe(file);
  });

  return filename;
}

// async function ColumnTransformer(block, notion) {
//   console.log("ColumnList", block)
//   let block_id = block.id;
//   const response = await notion.blocks.children.list({block_id})
//   console.log("Columns", response);
//   let columns = response.results;
//   if (columns.length != 2) {
//     console.log("Column list must have 2 columns");
//     return false;
//   }
//
//   let left = await notion.blocks.children.list({block_id: columns[0].id});
//   let right = await notion.blocks.children.list({block_id: columns[1].id});
//   console.log("Left", left);
//   console.log("Right", right);
//   if (right.results.length != 1) {
//     console.warn("Right column has more than one block, ignoring all but first");
//   }
//
//   let rightBlock = right.results[0];
//   if (rightBlock.type == `image`) {
//     console.log("Right image:" + rightBlock.image)
//     let file = rightBlock.image;
//     let url;
//     if (file.type == 'external') {
//       url = file.external.url;
//     } else if (file.type == 'file') {
//       url = file.file.url;
//     }
//     let caption = rightBlock.image.caption[0].plain_text
//
//
//     return `![${caption}](${url}){: w='400' .50 .right}`
//   }
//
//   // let {type, column_ratio, contents} = block.column;
//   // let col = '';
//   // contents.forEach(c => {
//   //     col += `{% include embed/youtube.html id='${c.video.external.url.split('v=')[1]}' %}`
//   // })
//   // return col;
// }

module.exports = { VideoTransformer, ImageTransformer };
