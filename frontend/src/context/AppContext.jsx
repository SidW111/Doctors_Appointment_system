import { createContext, useEffect, useState } from "react";
import { doctors } from "../assets/assets";
import axios from 'axios'
import { toast } from "react-toastify";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '$'
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    
    const [doctors,setDoctors] = useState([])
    const [token,setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):false)

    const [userData, setUserData] = useState(false)
  
    const getDoctorData = async () => {
        try {console.log("Backend URL:", backendUrl);

            const {data} = await axios.get(backendUrl + '/api/doctor/list')
            if(data.success) {
                setDoctors(data.doctors)
            } else{
                toast.error(data.message)
            }
        } 
            catch (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    console.log("Error response headers:", error.response.headers);
                    toast.error(error.response.data.message || "Server error");
                } else if (error.request) {
                    // The request was made but no response was received
                    console.log("Error request:", error.request);
                    toast.error("No response from server");
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log("Error message:", error.message);
                    toast.error(error.message);
                }
            
        }
    }


    const loadUserProfileData = async ()=> {

        try {

            const {data} = await axios.get(backendUrl + '/api/user/get-profile', {headers:{token}})
            if(data.success){
                setUserData(data.userData)
            } else{
                toast.error(data.message)
            }



        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                console.log("Error response data:", error.response.data);
                console.log("Error response status:", error.response.status);
                console.log("Error response headers:", error.response.headers);
                toast.error(error.response.data.message || "Server error");
            } else if (error.request) {
                // The request was made but no response was received
                console.log("Error request:", error.request);
                toast.error("No response from server");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log("Error message:", error.message);
                toast.error(error.message);
            }
        }
    }
    const value = {
        doctors,getDoctorData,
        currencySymbol,
        token,setToken,
        backendUrl,
        userData,setUserData,
        loadUserProfileData
    }


    useEffect(()=>{
        getDoctorData();
    },[])

    useEffect(()=>{
        if(token){
            loadUserProfileData()
        } else{
            setUserData(false)
        }
    },[token])
 
    return (
        <AppContext.Provider value={value}>
        {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider