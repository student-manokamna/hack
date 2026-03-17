import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
    return (
        <footer className="page-footer font-small unique-color-dark mt-5">

            <div style={{backgroundColor:'#6351ce'}}>
                <div className="container">
                    <div className="row py-4 d-flex justify-content-center align-items-center">
                        <div className="col-md-6 col-lg-5 text-center footer-text text-white">
                            CodeCrafters — Empowering Accessibility through AI
                        </div>
                    </div>
                </div>
            </div>

            <div className='container-fluid text-white pt-3' style={{backgroundColor:'rgba(33,37,41,1)'}}>
                <div className="container text-md-left mt-5">
                    <div className="row mt-3">
                        <div className="col-md-3 col-lg-4 col-xl-3 mx-auto mb-4">
                            <h6 className="text-uppercase font-weight-bold">CODECRAFTERS</h6>
                            <hr className="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style={{width:'60px'}}/>
                            <p className='footer-text'>The ultimate accessibility studio for real-time sign language translation and learning.</p>
                        </div>
                        <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 className="text-uppercase font-weight-bold">Services</h6>
                            <hr className="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style={{width:'60px'}} />
                            <p><Link to='/codecrafters/convert' className='footer-link'>Studio</Link></p>
                            <p><Link to='/codecrafters/learn-sign' className='footer-link'>Learn</Link></p>
                            <p><Link to='/codecrafters/all-videos' className='footer-link'>Gallery</Link></p>
                        </div>

                        <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
                            <h6 className="text-uppercase font-weight-bold">Resources</h6>
                            <hr className="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style={{width:'60px'}} />
                            <p><Link to='/codecrafters/home' className='footer-link'>Home</Link></p>
                            <p><Link to='/codecrafters/feedback' className='footer-link'>Feedback</Link></p>
                            <p><Link to='/codecrafters/create-video' className='footer-link'>Create Content</Link></p>
                        </div>

                        <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
                            <h6 className="text-uppercase font-weight-bold">Powered By</h6>
                            <hr className="deep-purple accent-2 mb-4 mt-0 d-inline-block mx-auto" style={{width:'60px'}}/>
                            <p><i className="fa fa-microchip me-3 ms-0"></i><span className='footer-text'> OpenAI Whisper</span></p>
                            <p><i className="fa fa-cubes me-3 ms-0"></i><span className='footer-text'> GPT-4o LLM</span> </p>
                            <p><i className="fa fa-eye me-3 ms-0"></i><span className='footer-text'> Gemini Vision OCR </span> </p>
                            <p><i className="fa fa-cube me-3 ms-0"></i><span className='footer-text'> Three.js VRM </span> </p>
                        </div>
                    </div>
                </div>

                <div className="footer-copyright text-center py-3">© 2026 CodeCrafters. Built for Innovation.</div>
            </div>
            </footer>
    )
}

export default Footer