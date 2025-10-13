import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();

	// URL ฐานของ API (สมมติว่าใช้ /api/login แต่เปลี่ยนเป็น absolute path เพื่อความชัวร์)
    const API_BASE_URL = 'http://localhost:8080/api'; 

	useEffect(() => {
		const rememberedEmail = localStorage.getItem('remembered_email');
		if (rememberedEmail) {
			setEmail(rememberedEmail);
			setRememberMe(true);
		}
	}, []);

	const togglePasswordVisibility = () => {
		setShowPassword(prev => !prev);
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		setError('');

		try {
			const response = await fetch(`${API_BASE_URL}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				const errorMessage = data.error || 'Authentication Fail: Please check user or Password';
				setError(errorMessage);
				return;
			}

			// ✅ บันทึก Remember Me Logic
			if (rememberMe) {
				localStorage.setItem('remembered_email', email);
			} else {
				localStorage.removeItem('remembered_email');
			}

            // **********************************************************
            // ✅ แก้ไข: ตรวจสอบ data.user ก่อนอ่าน role_name เพื่อป้องกัน TypeError
            // **********************************************************
			const token = data.token;
			const userRole = data.role;

			if (!token || !userRole) {
				// หาก Login สำเร็จ (200 OK) แต่โครงสร้าง JSON ผิดพลาด
				throw new Error("Login succeeded, but critical user data (Token or Role) is missing from the server response. Please check backend's AuthHandler.");
			}
            // **********************************************************

            // บันทึก Token (ใช้ Key 'jwt_token' ตามโค้ดต้นฉบับ)
			localStorage.setItem('jwt_token', token);
            // บันทึก Role (ใช้ Key 'user_role' ตามโค้ดต้นฉบับ)
			localStorage.setItem('user_role', userRole.toLowerCase());
            // บันทึก Email
			localStorage.setItem('userEmail', email);

            // ✅ Redirect Logic ตาม Role
			switch (userRole.toLowerCase()) {
				case 'admin':
					navigate('/admin');
					break;
				case 'approve':
					navigate('/approver'); 
					break;
				case 'user':
					navigate('/user');
					break;
				case 'recruiter':
					navigate('/recruiter'); 
					break;
				default:
					navigate('/');
					break;
			}

		} catch (err) {
            // ดักจับ Error ที่เราโยนขึ้นมา รวมถึง Error อื่นๆ
			console.error('Login error:', err);
			setError(err.message || 'An unexpected error occurred. Please try again later.');
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-white p-4">
			<div className="w-full max-w-sm p-8 space-y-6">
				<div className="text-center">
					<div className="mx-auto w-40 mb-4">
						<img
							src="/images/nakla.svg"
							alt="Nakla Manpower Logo"
							className="w-full h-auto"
						/>
					</div>
					<h2 className="text-3xl font-light text-gray-800 mt-4 mb-8">
						Log in
					</h2>
				</div>

				<form className="space-y-4" onSubmit={handleLogin}>
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
						<input
							id="email"
							type="text"
							required
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
						/>
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
						<div className="mt-1 relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								required
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
							/>

							<span
								onClick={togglePasswordVisibility}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer hover:text-gray-600 transition duration-150"
							>
								{showPassword ? (
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
									</svg>
								) : (
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
										<line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></line>
									</svg>
								)}
							</span>
						</div>
					</div>

					<div className="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
						/>
						<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
							Remember me
						</label>
					</div>

					<div>
						<button
							type="submit"
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
						>
							Sign in
						</button>
					</div>

					{error && (
						<p className="text-red-500 text-xs font-semibold text-center mt-2">
							{error}
						</p>
					)}
				</form>
			</div>
		</div>
	);
};

export default Login;