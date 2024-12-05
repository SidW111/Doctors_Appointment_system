import validator from 'validator';
import bcrypt from 'bcryptjs'; // Using bcryptjs for consistency
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import appointmentModel from '../models/AppointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import razorpay from 'razorpay';

// API TO REGISTER USER
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate user input
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password (at least 8 characters)" });
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "Email already registered" });
        }

        // Hash the user password
        const hashedPassword = bcrypt.hashSync(password, 10);

        const userData = {
            name,
            email,
            password: hashedPassword,
        };

        // Save the new user to the database
        const newUser = new userModel(userData);
        const user = await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API for User Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate user input
        if (!email || !password) {
            return res.json({ success: false, message: "Missing email or password" });
        }

        // Check if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        // Compare password
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};



//API to get user profile data

const getProfile = async (req,res) => {
    try {
        const {userId} = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({success:true,userData})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


//API to update user profile

const updateProfile = async (req,res) => {

    try {
        
        const {userId,name,phone,address,dob,gender} = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({success:false,message:"Data Missing"})
        }

        await userModel.findByIdAndUpdate(userId,{name,phone,address: JSON.parse(address),dob,gender})

        if(imageFile) {
            //upload image to cloudinary
            const imageupload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
            const imageURL = imageupload.secure_url

            await userModel.findByIdAndUpdate(userId,{image : imageURL})
        }

        res.json({success:true,message:"profile updated"})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// API to book appointment

const bookAppointment = async (req,res) => {
    try {
        const {userId, docId, slotDate, slotTime} = req.body
        const docData = await doctorModel.findById(docId).select('-password')

        if(!docData.available){
            return res.json({success:false,message:'Doctor not available'})
        }

        let slots_booked = docData.slots_booked

        // checking for slots availability
        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({success:false,message:'Slot not available'})
            }else{
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentdData = {
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentdData)
        await newAppointment.save()


        //save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({success:true,message:'Appointment Booked'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//API to get user appointments for frontend my-appointments page

const listAppointment = async  (req,res) => {

    try {
        const {userId} = req.body

        const appointments = await appointmentModel.find({userId})

        res.json({success:true,appointments})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// API to cancel appointment

const cancelAppointment = async (req,res)=> {
    try {
        const {userId,appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user
        if(appointmentData.userId !== userId){
            return res.json({success:false,message:'Unauthorized action'})

        
        }

        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        //releasing doctors slot

        const {docId,slotDate,slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({success:true,message:'Appointment Cancelled'})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})



// API to make payment of appointment using Razorpay
const paymentRazorpay = async (req, res) => {
    try {
        console.log("Starting paymentRazorpay API...");

        // Log request body
        console.log("Request Body:", req.body);

        const { appointmentId } = req.body;
        if (!appointmentId) {
            console.error("Error: appointmentId is missing in the request.");
            return res.status(400).json({ success: false, message: "appointmentId is required" });
        }

        console.log(`Fetching appointment data for ID: ${appointmentId}`);

        // Fetching appointment data from the database
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            console.error("Error: Appointment data not found for ID:", appointmentId);
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }

        console.log("Appointment Data Fetched:", appointmentData);

        if (appointmentData.cancelled) {
            console.error("Error: Appointment is already cancelled for ID:", appointmentId);
            return res.status(400).json({ success: false, message: "Appointment is cancelled" });
        }

        // Prepare Razorpay order options
        const options = {
            amount: appointmentData.amount * 100, // Amount in the smallest currency unit (e.g., paise for INR)
            currency: process.env.CURRENCY || 'INR',
            receipt: appointmentId.toString(),
        };

        console.log("Razorpay Order Options:", options);

        // Create Razorpay order
        console.log("Creating Razorpay order...");
        const order = await razorpayInstance.orders.create(options);

        console.log("Razorpay Order Created Successfully:", order);

        // Sending the created order in the response
        res.status(200).json({ success: true, order });

    } catch (error) {
        console.error("Razorpay Error Message:", razorpayError.message);
    console.error("Razorpay Error Details:", razorpayError);
    return res.status(500).json({ success: false, message: "Razorpay order creation failed" });
    }
};

//API to verify the payment of razorpay

const verifyRazorpay = async (req,res) => {
    try { 
        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({success:true,message:"payment successful"})
        } else {
            res.json({success:false,message:"Payment failed"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


export {registerUser,loginUser,getProfile,updateProfile,bookAppointment,listAppointment,cancelAppointment,paymentRazorpay,verifyRazorpay} 