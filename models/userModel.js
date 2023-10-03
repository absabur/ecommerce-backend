const { Schema, model } = require("mongoose")
const validator = require("validator")
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter Your name."],
        trim: true,
        minlength: [3, 'User Name must be atleast 3 charecter.'],
        maxlength: [30, 'User Name allowed max 30 charecter.'],
    },    
    email: {
        type: String,
        required: [true, "Please enter email."],
        trim: true,
        unique: [true, "email already in user"],
        validate: [validator.isEmail, "Please Enter a valid Email"],
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [6, "Password should be greater than 6 characters"],
        select: false,
      },
    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isBan: {
        type: Boolean,
        default: false,
    },
    cart: [
        {
            productId: {
                type: Schema.ObjectId,
                required:true,
            },
            quantity: {
                type: Number,
                required:true,
            },
            name: {
                type: String,
            },
            price: {
                type: Number,
            },
            stock: {
                type: Number,
            },
            image: {
                type: String,
            }
        },
    ],
    address: {
        division: {
            type: String,
            // required: [true, "Please enter Division."],
        },
        district: {
            type: String,
            // required: [true, "Please enter District."],
        },
        upozila: {
            type: String,
            // required: [true, "Please enter Upozila."],
        },
        address: {
            type: String,
            // required: [true, "Please enter Address."],
        },
        number: {
            type: String,
            // required: [true, "Please enter Number."],
        },
        email: {
            type: String,
            required: [true, "Please enter email."],
            trim: true,
            validate: [validator.isEmail, "Please Enter a valid Email"],
        }
    }

}, {timestamps: true});

userSchema.pre("save", async function(next){
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs.hash(this.password, 10)
});

userSchema.methods.getJWTToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    })
}



userSchema.methods.comparedPassword = async function(pass) {
    return await bcryptjs.compare(pass, this.password)
}



const User = model('User', userSchema);

module.exports = User;