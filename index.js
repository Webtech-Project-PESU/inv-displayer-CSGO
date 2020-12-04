const express = require('D:/COLLEGE CRAP/Y2/WebDev/node-v14.13.0-win-x64/node_modules/npm/node_modules/express');
const path = require('D:/COLLEGE CRAP/Y2/WebDev/node-v14.13.0-win-x64/node_modules/npm/node_modules/path');
const bodyParser = require('D:/COLLEGE CRAP/Y2/WebDev/skinMart/node_modules/body-parser');
const market = require('D:/COLLEGE CRAP/Y2/WebDev/node-v14.13.0-win-x64/node_modules/npm/node_modules/steam-market-pricing');
const InventoryApi = require('D:/COLLEGE CRAP/Y2/WebDev/skinMart/node_modules/steam-inventory-api/dist/index.js');
const fs = require('fs');
const inventoryLayout = require("./mongoose");
const mongoose = require("../node-v14.13.0-win-x64/node_modules/npm/node_modules/mongoose");
//const { name } = require('D:/COLLEGE CRAP/Y2/WebDev/skinMart/node_modules/body-parser');

const app = express();
const inventoryApi = Object.create(InventoryApi);
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '10mb' }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'market_page.html'));
});

app.post('/', (req, response) => {
    //this.req = req;
    //this.req.body.steamid = req.body.steamID;
    //console.log('\n\n' + req.body);

    inventoryApi.init
    ({
        id : 'V.1',
        proxyRepeat : 1,
        maxUse : 25,
        requestInterval : 60*1000,
    });

    const contextid = 2;
    const appid = 730;
    const start_assetid = 730;
    const count = 5000;
    const language = 'english';
    const tradable = false;
    const steamid = req.body.post;
    console.log('\n\n\t\t\t\t' + steamid);

    inventoryApi.get
    ({
        appid,
        contextid,
        steamid,
        tradable,
        language,
        count,
        start_assetid,
    })
    .then((res) => {
        //console.log(res);
        //var net_worth = 0;
        /*var names = [[],[],[]];
        res.items.map(
            item => {
                names[0].push(item.market_hash_name);
                names[1].push(item.tradable);
                names[2].push(item.type);
            });
        console.log(names);*/
        var myInventory = inventoryLayout({
            accountId64: steamid,
            totalItems: res.total,
            //netWorth: net_worth,
            items: []
        });
        res.items.map(
            item => {
                var obj = {
                    name: item.market_hash_name,
                    tradable: item.tradable,
                    type: item.type
                }
                //console.log(obj);
                myInventory.items.push(obj);
            }
        );
        /*market.getItemsPrices(730, names[0]).then(items => {
            var prices = [];
            console.log(items);
            names.forEach(name => {
                if(name.success == true) {
                    //var arr = (name.lowest_price).split("$");
                    prices.push(name.lowest_price);
                    //net_worth = net_worth.toFixed(2);
                    //console.log(name.lowest_price);
                }
            });
            names.push(prices);
            //console.log("TOTAL:",net_worth);
            console.log(names);
            response.json(myInventory);
        })*/
        console.log('saving Inventory');
        response.json(myInventory);
        fs.writeFileSync('./inv_displayer/src/inventories/' + steamid + '.json', JSON.stringify(myInventory));
        inventoryLayout.findOneAndRemove({accountId64: steamid}).then(() => {
            myInventory.save();
        });
    })
    .catch((err) => {
        if(err.statusCode === 500) {
            console.log(err + "\nError 500, INVENTORY INACCESSIBLE\tThis was a Steam Server side error, Inventory is public but our request to steam didn't get any response back from steam servers.");
            var myInventory = inventoryLayout({
                totalItems: "Error 500, INVENTORY INACCESSIBLE => This was a Steam Server side error, Inventory is public but our request to steam didn't get any response back from steam servers."
            });
            response.json(myInventory);
        }
        else {
            console.log(err + '\nError 403, INVENTORY INACCESSIBLE\tMake Your Inventory Public Please :(');
            var myInventory = inventoryLayout({
                totalItems: "Error 403, INVENTORY INACCESSIBLE => Make Your Inventory Public Please :("
            });
            response.json(myInventory);
        }
    })
});

app.post('/more-info', (req, res) => {
    const item = req.body.item;
    market.getItemPrice(730, item).then((price) => {
        console.log(price);
        res.json(price);
    }).catch((err) => {
        console.log(err);
        res.json(err);
    })
})

const PORT = process.env.port || 6969;

app.listen(PORT, () => console.log('Server hosted on port ' + PORT));
