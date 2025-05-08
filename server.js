const express = require('express');
const Gun = require('gun');
const app = express();

app.use(Gun.serve);
app.use(express.static(__dirname));

const server = app.listen(8765, () => {
    console.log('伺服器執行於 http://localhost:8765');
});

Gun({ web: server });