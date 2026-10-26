import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, password, role } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email",
      });
    }

    const selectedRole = role || "customer";
    if (!["customer", "mechanic"].includes(selectedRole)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password,
      role: selectedRole,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


//Generate JWT Token
const generateToken = (userId)=>{
    return jwt.sign({
        id:userId
    },
    process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN || "7d",
    }
);
};

//Login API

export const login = async (req, res) => {
try {
const { email, password, role } = req.body;

if (!email?.trim() || !password || !role) {                  //ethavathu field miss aki irrukka endu pakka
  return res.status(400).json({
    message: "Please provide email, password and role",
  });
}

if (!["customer", "mechanic"].includes(role)) {
  return res.status(400).json({
    message: "Invalid role",
  });
}

const user = await User.findOne({
  email: email.trim().toLowerCase(),
});

if (!user) {
  return res.status(401).json({
    message: "Invalid email or password",
  });
}

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({
    message: "Invalid email or password",
  });
}

if (user.role !== role) {
  return res.status(403).json({
    message: "This account does not belong to the selected role",
  });
}

const token = generateToken(user._id.toString());

return res.status(200).json({
  message: "Login successful",
  token,
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  },
});

} catch (error) {
console.error("Login error:", error.message);

return res.status(500).json({
  message: "Internal server error",
});

}
};

// Current User API
export const getMe = async (req, res) => {      //getMe function use panrathu login aana current user-oda details-ai retrieve panna.
try {
const user = await User.findById(req.user).select("-password");

if (!user) {
  return res.status(404).json({
    message: "User not found",
  });
}

return res.status(200).json({ user });

} catch (error) {
console.error("Get user error:", error.message);

return res.status(500).json({
  message: "Internal server error",
});

}
};
