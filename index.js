import express, { urlencoded } from "express";
import cors from "cors";
import mongoose, { model, mongo } from "mongoose";
import { json } from "express";
import userModels from "./models/userDetails.js";
import userContact from "./models/Contact.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from 'dotenv';
config();
const app = express();
const port = process.env.PORT;
const url = process.env.MONGODB_URL;

// mongoDB connection 
mongoose.connect(`${url}`).then(
    () => {
        console.log("database connected successfully");
    }
);


// mongoose.connect("mongodb+srv://USER:X4YtymbjdkRYcfT5@atlascluster.nilxnts.mongodb.net/ContactApp?retryWrites=true&w=majority").then(
//     () => {
//         console.log("database connected successfully");
//     }
// );

app.use(cors());
app.use(json());


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "api runnning successfully"
    })
})


//token generation utility function
const tokenGeneration = (user_id) => {
    const token = jwt.sign({
        user_id
    }, 'secret', { expiresIn: '3hr' });
    return token;
}

//middleware
const checkToken = (req, res, next) => {
    const tokenBearer = req.headers.authorization;
    const token = tokenBearer.split(" ")[1];
    //if token present or not
    if (!token) {
        return res.status(401).json({
            message: "user not authorized"
        })
    }
    //validation and verification
    try { 
        let decodedToken = jwt.verify(token, "secret");
        req.user_id = decodedToken.user_id;
    }
    catch {
        return res.status(403).json({
            message: "either your token got expired and its invalid"
        })
    }
    next();
}
//user-register

app.post("/register", (req, res) => {
    const name = req.body.name;
    const username = req.body.username;
    const password = bcrypt.hashSync(req.body.password, 10);

    if (!name || !username || !password) {
        return res.status(400).json({
            message: "pls fills the details properly"
        })
    }
    userModels.findOne({
        username: username
    }).then((data, err) => {
        if (data) {
            res.json({
                message: "this username is not available"
            })
        }
        else {
            userModels.create({
                name: name,
                username: username,
                password: password
            }).then((data, err) => {
               console.log(data._id);
                return res.status(200).json({
                    message: "you are registered successfully",
                    data: data,
                    token: tokenGeneration(data._id)
                })
            })
        }
    })
})


//user-login
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username) {
        return res.status(400).json({
            message: "Pls fill the data properly"
        })
    }
    userModels.findOne({
        username: username,
    }).then((data, err) => {
        if (err) {
            return res.return(500).json({
                message: "internal server error"
            })
        }
        //if data found
        if (data) {
            const isMatch = bcrypt.compareSync(password, data.password);
            if (isMatch) {
                return res.status(200).json(
                    {
                        message: "you are logged in",
                        token: tokenGeneration(data._id)
                    }
                )
            }
            else {
                return res.status(400).json({
                    message: "incorrect password"
                })
            }
        }
        else {
            return res.status(404).json(
                {
                    message: "Invalid credentials"
                }
            )
        }
    });
})

// contacts
//add-contact // bugs resolved
app.post("/add-contact", checkToken, (req, res) => {
    const user_id = req.user_id;
    const name = req.body.name;
    const contact = req.body.contact;
    if (!name || !contact) {
        return res.status(400).json({
            message: "pls fill the data carefully"
        })
    }
    userContact.create({
        user_id, name, contact
    }).then((data, err) => {
        if (err) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }
        if (data) {
            return res.status(201).json({
                message: "contact added successfully",
                contact: data
            })
        }
    })
})


//get all the contact of the specified user(on the basis of user id ) //bug resolved
app.get("/get-contacts", checkToken, (req, res) => {
    //assuming that we have the id of the logged in person
    const user_id = req.user_id ;// no need of params because we have attached the user_id with the request
    userContact.find(
        {
           user_id
        }
    ).then((data, err) => {
        if (err) {
            return res.status(500).json({
                message: "Internal error"
            })
        }
        if (data) {
            console.log(data);
            return res.status(200).json({
                message: "data fetched",
                contact: data
            })
        }
        else {
            return res.status(404).json({
                message: "no data present"
            })
        }
    })
})

//update one contact(only number)  //bugs resolved
app.patch("/update-contact/:contact_id", checkToken, (req, res) => {
    const contact_id = req.params.contact_id;
    const contact = req.body.contact;
    if (!contact) {
        return res.status(400).json({
            message: "fill the data correctly"
        })
    }
    userContact.findByIdAndUpdate(
        {
            _id: contact_id
        },
        {
            contact: contact
        }, {
        new: true
    }
    ).then((data, err) => {
        if (err) {
            return res.status(500).json({
                message: "internal server not working"
            })
        }
        if (data) {
            if (req.user_id != data.user_id) {
                return res.status(404).json({
                    message: "no contacts found"
                })
            }
            return res.status(200).json({
                message: "data is update",
                contact: data
            })
        }
        else {
            return res.status(404).json({
                message: "data updated"
            })
        }
    })
});

//delete-contact
app.delete("/delete-contact/:contact_id", checkToken, (req, res) => {
    const _id = req.params.contact_id;
    if (!_id) {
        return res.status(404).json({
            message: "pls enter the contact to deleted"
        })
    }
    userContact.findById(
        {
            _id: _id
        }
    ).then((data, err) => {
        if (data) {
            userContact.findByIdAndDelete(_id).then((data, err) => {
                if (err) {
                    return res.status(500).json({
                        message: "internal server error"
                    })
                }
                if (data) {
                    console.log
                    if (data.user_id != req.user_id) {
                        return res.status(404).json({
                            message: "no contacts found to be deleted."
                        })
                    }
                    else {
                        return res.status(200).json({
                            message: "data successfully deleted"
                        })
                    }
                }
                else {
                    return res.status(404).json({
                        message: "contact not found"
                    })
                }
            })
        }
        else {
            return res.status(404).json({
                message: "contact not found"
            })
        }
    })

})


//get contact on the basis of id //bug resolved
app.get("/get-contact/:contact_id", checkToken, (req, res) => {
    const _id = req.params.contact_id;
    userContact.findById({
        _id: _id
    }).then((data, err) => {
        if (err) {
            return res.status(500).json({
                message: "internal server not working"
            })
        }
        if (data) {
            if (data.user_id != req.user_id) {
                return res.status(404).json({
                    message: "contact not found",
                })
            }
            else {
                return res.status(200).json({
                    message: "contact successfully fetched",
                    contact: data
                })
            }
        }
        else {
            return res.status(404).json({
                message: "contact not found"
            })
        }
    })
})


app.listen(`${port}`,()=>{
    console.log("port is listening at: "+ port);
})
