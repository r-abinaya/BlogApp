const express=require('express');
const app=express();
require('dotenv').config();
const cors= require('cors');
const mongoose =require("mongoose");
const bcrypt =require('bcryptjs');
const User=require('./models/User');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest:'uploads/'});
const fs =require('fs');
const Post=require('./models/Post');

const salt=bcrypt.genSaltSync(10);
const secret='dhjsgfgusdif8934h3j4829h32ik';


app.use(cors({
    origin: 'http://localhost:3000',
    credentials:true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname+'/uploads'));

mongoose.connect(process.env.MONGO_URL);

app.post('/register',async (req,res)=>{
    const {username,password} =req.body;
    try{
        const userDoc=await User.create({
            username,
            password:bcrypt.hashSync(password,salt),
        });
        res.json(userDoc);
    }
    catch(e){
        res.status(400).json(e);
    }

});

app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const userDoc = await User.findOne({ username });
  
      if (!userDoc) {
        return res.status(400).json('User not found');
      }
  
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        const token = jwt.sign({ username, id: userDoc._id }, secret, {});
        res.cookie('token', token).json({
          id:userDoc._id,
          username,
        });
      } else {
        res.status(400).json('Wrong credentials');
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) {
            res.status(401).json({ error: 'Unauthorized' }); // Send an error response if JWT verification fails
        } else {
            res.json(info); // Send the JSON data from JWT payload
        }
    });
});

app.post('/logout',(req,res)=>{
  res.cookie('token',' ').json('ok');
});

app.post('/post',uploadMiddleware.single('file'),async (req,res)=>{
  const {originalname,path} = req.file;
  const parts=originalname.split('.');
  const ext=parts[parts.length-1];
  const newPath =path+'.'+ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
        res.status(401).json({ error: 'Unauthorized' }); // Send an error response if JWT verification fails
    } else {
      const {title,summary,content} =req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author:info.id,
      });
    
      res.json(postDoc);
    }
  }); 
});

// app.put('/post',uploadMiddleware.single('file') ,async (req,res)=>{
//   const newPath = null;
//   if(req.file){
//     const {originalname,path} = req.file;
//     const parts=originalname.split('.');
//     const ext=parts[parts.length-1];
//     newPath =path+'.'+ext;
//     fs.renameSync(path, newPath);
//   }

//   const token =req.cookies;
//   jwt.verify(token, secret, {}, async (err, info) => {
//     if (err) {
//         res.status(401).json({ error: 'Unauthorized' }); // Send an error response if JWT verification fails
//     } 
    
//     const {id,title,summary,content} =req.body;
//     const postDoc = await Post.findById(id);
//     const isAuthor =null;
//     if(info && info.id){
//       const isAuthor =JSON.stringify(postDoc.author) === JSON.stringify(info.id);
//     }
    
//     if(!isAuthor){
//       return res.status(400).json('You are not the author');
//     }
//     await postDoc.update({
//        title,
//        summary,
//        content,
//        cover:newPath ? newPath : postDoc.cover,
//      });
    
//     res.json(postDoc);  
    
//   }); 
  
// });


app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;

  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const token = req.cookies.token; // Get the token from cookies

  try {
    const info = jwt.verify(token, secret);

    // Verify if the user is authorized to update the post
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);

    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isAuthor = String(postDoc.author) === info.id;

    if (!isAuthor) {
      return res.status(401).json({ error: 'Unauthorized - You are not the author' });
    }

    // Update the post
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});


app.get('/post',async (req,res)=>{
   res.json(
     await Post.find()
     .populate('author',['username'])
     .sort({createdAt:-1})
     .limit(20)
   );
});

app.get('/post/:id',async (req,res)=>{
  const {id}=req.params;
  const PostDoc =await Post.findById(id).populate('author',['username']);
  res.json(PostDoc);
});




app.listen(4040,()=>{
    console.log("server started on 4040")
});






//mongodb+srv://rabinaya2142003:0YuGxx2rLedsyAY6@cluster0.ojrtitu.mongodb.net/
//0YuGxx2rLedsyAY6

