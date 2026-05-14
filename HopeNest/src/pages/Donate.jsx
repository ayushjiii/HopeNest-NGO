import React from "react";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer.jsx";
import Donation from "../component/Donation.jsx";
import WhDoGo from "../component/WhDoGo.jsx";


function Donate() {
    return (
        <>
        <Navbar />
        <Donation />
        <WhDoGo />
        <Footer />
        </>
    );
}   

export default Donate;