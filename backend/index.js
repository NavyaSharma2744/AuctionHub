import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

let count = 0;

app.get("/getCount", (req,res)=>{
    res.send({"count": count})
})

app.post("/increment", (req,res)=>{
    count = count + 1;
    res.send({"count": count});
    console.log("Count incremented to: ", count);
});

app.get("/test", (req, res) =>{
    res.send("Hello World")
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})