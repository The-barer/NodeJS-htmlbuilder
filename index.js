const { readdir, readFile } = require('fs/promises');
const { createWriteStream } = require('fs');

const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const stylePath = path.join(__dirname, 'styles')
const assets = path.join(__dirname, 'assets')
const componentsDir = path.join(__dirname, 'components')
const destFolder = path.join(__dirname, 'project-dist')

const OUTPUT_STYLE_FILE = 'style.css';
const STYLES_FORMATS = ['.css'];
const ENCODING_FORMAT = 'utf8';

buildPage()

async function buildPage() {
    try {
        await fsp.rm(destFolder, { recursive: true } )
    }
    catch {
    }
    await fsp.mkdir(destFolder)
    mergeStyles(stylePath, destFolder)
    copyFiles(assets, path.join(destFolder, 'assets'))
    createIndexHtml()
}

// https://www.geeksforgeeks.org/node-js-fs-promise-readdir-method/

async function mergeStyles(inputPath, outputPath) {
    // use const for name like style.css
    try {
        const styleStream = await createWriteStream(path.join(outputPath, OUTPUT_STYLE_FILE))
        const files = await readdir(inputPath, { withFileTypes: true });

        files.forEach(async (file) => {
            if(file.isDirectory()) return;

            const filePath = path.join(inputPath, file.name)

            if(STYLES_FORMATS.includes(path.extname(filePath))) {
                const fileData = await readFile(filePath, { encoding: ENCODING_FORMAT });

                styleStream.write(fileData+'\n');
            }
        })
    } catch (err) {
        console.error('mergeStyles', err);
    }
}

function copyFiles(startPath, destPath) {
    fs.rm(destPath, {recursive: true}, () => {
        fs.mkdir(destPath, {recursive: true}, () => {})
        fs.readdir(startPath, { withFileTypes: true }, (err, files) => {
            if (err) {
                if(err.code === 'ENOENT') {
                    return console.log('Исходная папка не существует!');
                }   else {throw err}
            }
            for (let file of files) {
                const origfilePath = path.join(startPath, file.name)
                const destFilePath = path.join(destPath, file.name)
                if(file.isDirectory()) {
                    copyFiles(origfilePath, destFilePath)
                }
                else if(file.isFile()) {
                    fs.copyFile(origfilePath, destFilePath, ()=> {})
                }
            }
        })

    })
}

async function createIndexHtml() {
    const list = (await fsp.readdir(componentsDir)).filter((elem)=>{
       return elem.split('.')[1] === 'html'
    })
    const obj = Object.fromEntries(list.map(elem => {
        let elemPath = path.join(componentsDir, elem)
        let elemName = path.basename(elemPath)
        return [elemName.split('.')[0], elemPath]
    }))
    let html = (await fsp.readFile(path.join(__dirname, 'template.html'))).toString()
    for (let key of Object.keys(obj)) {
        const htmlContent = (await fsp.readFile(obj[key])).toString()
        html = html.replace(`{{${key}}}`, htmlContent)
    }
    await fsp.writeFile(path.join(destFolder, 'index.html'), html)
}


