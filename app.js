const express=require("express");
const app=express();

const userModel=require("./models/user");
const postModel=require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt=require("bcrypt");

const jwt=require("jsonwebtoken")
app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


app.get("/",function(req,res){
    res.render("home");
})




app.get("/create",function(req,res){
    res.render("index");
})
app.post("/register",async function(req,res){
    let {email,password,username,name,age}=req.body;
   let user=await  userModel.findOne({email});
   if (user){ return res.status(500).send("user already registered")}
   bcrypt.genSalt(10,function(err,salt){
    bcrypt.hash(password,salt,async function(err,hash){
        let user = await userModel.create({
            username,
            email,
            password:hash,
            name,
            age
           })
        
        let token=jwt.sign({email,userid:user._id},"man");   
        res.cookie("token",token);
        console.log(token)
        res.redirect("/profile")
        });
});

})
app.get("/profile",isLoggedIn,async function(req,res){
    let user = await userModel.findOne({email:req.user.email}).populate("posts");
    console.log(user)
    
    res.render("profile",{user});
})

app.post("/post",isLoggedIn,async function(req,res){
    let user = await userModel.findOne({email:req.user.email});
    let {content}=req.body;
    let post = await postModel.create({
        user:user._id,
        content,

    });
    user.posts.push(post._id);
   await  user.save();
   res.redirect("/profile")
})


app.get("/login",function(req,res){
    res.render("login");
})
app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/login")
})

app.post("/login",async function(req,res){
    let {email,password}=req.body;
   let user=await  userModel.findOne({email});
   console.log(user)
   if (!user) return res.status(300).send("not valid")
   bcrypt.compare(password,user.password,function(err,result){
if(result){
    let token=jwt.sign({email,userid:user._id},"man");   
    res.cookie("token",token);
    res.status(200).redirect("/profile")}
else res.redirect("/login")})
})


function isLoggedIn(req,res,next){
    if(req.cookies.token=="")
    {
        res.redirect("/login")
    }
    else{
       let data =  jwt.verify(req.cookies.token,"man");
       req.user=data;
    }
    next();
}
app.listen(3000);





