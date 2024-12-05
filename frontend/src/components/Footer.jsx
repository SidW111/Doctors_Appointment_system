import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        {/* {----left section} */}
        <div>
            <img className='mb-5 w-40' src={assets.logo} alt="" />
            <p className='w-full md:w-2/3 text-gray-600 leading-6'>Prescripto provides tools for booking doctor appointments and managing medical records. The content is for informational purposes only and should not be taken as medical advice.</p>
        </div>
        {/* {----center section} */}
        <div>
            <p className='text-xl font-medium mb-5'>Company</p>
            <ul>
                <li className='flex flex-col gap-2 text-color-gray-699'>Home</li>
                <li>About us</li>
                <li>Contact us</li>
                <li>Privacy Policy</li>
            </ul>
        </div>
        {/* {----right section} */}
        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-2 text-color-gray-699'>
                <li>+1-868-627-9372</li>
                <li>siddhantwaingade@gmail.com</li>
            </ul>
        </div>
      </div>
      {/* {<-----Copy Right ----->} */}
      <div >
            <hr />
            <p className='py-5 text-sm text-center'>Copyright 2024@ Prescripto - All Right Reserved</p>
      </div>
    </div>
  )
}

export default Footer
