const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const stylePath = path.join(__dirname, 'styles')
const assets = path.join(__dirname, 'assets')
const componentsDir = path.join(__dirname, 'components')
const destFolder = path.join(__dirname, 'project-dist')

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

function mergeStyles(startPath, destPath) {
    const styleStream = fs.createWriteStream(path.join(destPath, 'style.css'))
    fs.readdir(startPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            throw err
        }
        for (let file of files) {
            const filePath = path.join(startPath, file.name)
            if(file.isDirectory()) {
                return
            } 
            else if(path.extname(filePath) === '.css') {
                fs.readFile(filePath,'utf-8',(err, data) => {
                    if(err) {
                        throw err
                    }
                    styleStream.write(data+'\n')
                })
            }
        }
    })   
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


