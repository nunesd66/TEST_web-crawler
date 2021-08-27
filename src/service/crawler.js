const axios = require('axios');
const cheerio = require('cheerio');

async function fecthData(url) {
    try {
        const result = await axios.get(url);
        return result.data;
    }
    catch(error) {
        status = 'erro';
        console.log('> CRAWLER ERROR fecthData: \n', error);
    }   
}

async function officialGitPageIsExists(search, basePath) {
    try {
        const path = basePath + 'topics/' + search;
        const content = await fecthData(path);
        const $ = cheerio.load(content);

        const uriPageGit = 'main > div > div.topic div.d-md-flex > div.col-md-4 > dl.my-4 > dd.mb-1 > svg';
        const result = $(uriPageGit).attr("class");
            
        if(result == undefined) 
            return false;
        
        if(result.includes('octicon-organization') || result.includes('octicon-repo')) {
            const name = $('main > div > div.topic div.d-md-flex > div.col-md-4 > dl.my-4 > dd.mb-1:nth-of-type(1) > a > span').text().trim();
            urlParameter = name.includes('/') ? (name.split("/"))[0] : name;
            return urlParameter;
        }
        
        return false;
    }
    catch(error) {
        status = 'erro';
        console.log('> CRAWLER ERROR officialGitPageIsExists: \n', error);
        return false;
    }
}

async function linkIsWorking(url) {
    try {
        const {status} = await axios.head(url);
        if(status == 200) 
            return true;
        
        return false;
    }
    catch(error) {
        status = 'erro';
        console.log('> CRAWLER ERROR linkIsWorking: \n', error);
        return false;
    }
}

function brokenCrawler(search, tag) {    
    try {
        const fs = require('fs');

        fs.access(__dirname+'/log/', (error) => {
            if(error) {
                if(error.code == 'ENOENT')
                    fs.mkdir(__dirname+'/log', e => {if(e) throw e });
                else 
                    throw error;
            }
        });

        fs.access(__dirname+'/log/logError.txt', (error) => {
            const resultSet = search + ' > ' + tag + ' > ' + new Date();
            const inputData = JSON.stringify(resultSet, null, 2);
            
            if(error) { 
                if(error.code == 'ENOENT') {
                    fs.writeFile(__dirname+'/log/logError.txt', inputData, (error) => {
                        if(error) 
                            throw error;
                    });
                } else
                    throw error;
            }
            else {
                fs.appendFile(__dirname+'/log/logError.txt', '\n' + inputData, (error) => {
                    if(error) 
                        throw error;
                });
            }
        });
    }
    catch(error) {
        console.log('> CRAWLER ERROR brokenCrawler: \n', error);
    }
    finally {
        return false;
    } 
}

async function runCrawler(search) {
    try {        
        const basePath = "https://github.com/";

        if(!(await linkIsWorking(basePath)))
            return brokenCrawler(search, 'link');
            
        const gitName = await officialGitPageIsExists(search, basePath);
        if(!gitName)
            return {message: 'Não existe uma página oficial para: ' + search};
        
        const path = basePath + gitName;
        const content = await fecthData(path);
        const $ = cheerio.load(content);

        let resultSet = {};

//  === HEADER ===
        let header = {};
        Object.assign(resultSet, {header});

    //  === TITLE  ===
        const title = $('header.pagehead div.flex-1 > h1').text().trim();
        if(title == '') 
            return brokenCrawler(search, 'title');
        Object.assign(resultSet.header, {title});

    // === AVATAR ===
        const avatar = $('header.pagehead div.d-flex > div > img').attr("src");
        if(!avatar) 
            return brokenCrawler(search, 'avatar');
        Object.assign(resultSet.header, {avatar});
        
    // === URLS ===
        let urls = [];
        $('div.d-md-flex ul.f6 li a.color-text-primary').each((index, element) => {
            const description  = $(element).text();
            const url= $(element).attr("href");
            urls.push({url, description});
        })
        if(urls == '')
            return brokenCrawler(search, 'urls');
        Object.assign(resultSet.header, {urls});

    //  === TOP LANGUAGES ===
        let topLanguages = [];
        const uriTopLanguages = '.gutter-condensed .flex-shrink-0 .px-3 div:nth-of-type(2) div a span span[itemprop="programmingLanguage"]';
        $(uriTopLanguages).each((index, element) => { 
            topLanguages[index] = $(element).text().replace(/\s/g, '');
        });
        if(topLanguages.length < 1)
            return brokenCrawler(search, 'topLanguages');
        Object.assign(resultSet.header, {topLanguages});
        
    //  === TOP TAGS ===
        let topTags = [];
        const containsTopTags = ($('.gutter-condensed .col-md-3 .px-3 div.py-3:nth-of-type(3) div .mb-2 h4')
            .text()).includes('Most used topics');
        if(containsTopTags) {
            $('.gutter-condensed .col-md-3 .px-3 div.py-3:nth-of-type(3) div .flex-wrap a')
                .each((index, element) => topTags[index] = $(element).text().trim());
        }
        if(containsTopTags && topTags.length < 1)
            return brokenCrawler(search, 'topTags');
        Object.assign(resultSet.header, {topTags});

    //  === TOP USERS ===
        let topUsers = [];
        const uritopUsers = 'main .col-md-3 div.pb-3 div .clearfix a';
        $(uritopUsers).each((index, element) => {
            topUsers[index] = $(element).attr("href").replace("/", "");
        });
        if(topUsers.length < 1)
            return brokenCrawler(search, 'topUsers');
        Object.assign(resultSet.header, {topUsers});

//  === PINNED ===
        let pinned = [];
        $('ol.d-flex li').each((index, element) => {
            const repository = $(element).find("span").attr("title");
            const url = basePath + $(element).find("a").attr("href");
            const description = $(element).find("p.pinned-item-desc").text().trim();
            const language = $(element).find("p.mb-0 > span > span").text().trim();
            const stars = $(element).find("p.mb-0 > a:first-of-type").text().trim();
            const forks = $(element).find("p.mb-0 > a:last-of-type").text().trim();
            pinned.push({repository, url, description, language, stars, forks});
        }) // END each() - PINNED
        for(let p of pinned) {
            if(p.repository == null) 
                return brokenCrawler(search, 'pinned');
        }
        Object.assign(resultSet, {pinned});

//  === REPOSITORIES ===  
        let repositories = [];
        let i = 1;
        while($('div.org-repos li').length > 0) {
            const path = basePath + "orgs/" + gitName + "/repositories?page=" + i;
            const content = await fecthData(path);
            const $ = cheerio.load(content);

            $('div.org-repos li').each((index, element) => {
                const repository = $(element).find('div > div > h3 > a').text().trim();
                
                
                const status = $(element).find('div > div > h3 > span').text().trim();
                const url = basePath + $(element).find('div > div > h3 > a').attr("href").replace("/" + search, search);
                const description = $(element).find('div > div > p').text().trim();
                
                const tags = $(element).find('div div div a').map((i,e) => {
                    return $(e).text().trim();
                }).toArray();
                
                const language = $(element).find('div > span.mr-3 > span').text();
                const forks = $(element).find('div.color-text-secondary > a:nth-of-type(1)').text().replace(/\s/g, '');
                const stars = $(element).find('div.color-text-secondary > a:nth-of-type(2)').text().replace(/\s/g, '');
                const issues = $(element).find('div.color-text-secondary > a:nth-of-type(3)').text().replace(/\s/g, '');
                
                let pullRequests = $(element).find('div.color-text-secondary > a:nth-of-type(4)').text().replace(/\s/g, '');
                if(pullRequests.includes("help")) {
                    pullRequests = $(element).find('div.color-text-secondary > a:nth-of-type(5)').text().replace(/\s/g, '');
                }
                
                const lastUpdate = $(element).find('div.color-text-secondary > span:last-of-type > relative-time').attr("datetime");
        
                repositories.push({
                    repository,
                    status,
                    url,
                    description,
                    tags,
                    language,
                    forks,
                    stars,
                    issues,
                    pullRequests,
                    lastUpdate
                });
            }) // END each()

            if(repositories[repositories.length-1].repository == "")
                return brokenCrawler(search, 'repositories');

            if($('div.org-repos li').length < 30) { break; }
            i++;
        } // END while() - REPOSITORIES
        Object.assign(resultSet, {repositories});

        return resultSet;
    }
    catch(error) {
        status = 'erro';       
        console.log('> CRAWLER ERROR runCrawler: \n', error);
        return false;
    }
} // END runCrawler()

module.exports = {runCrawler};
