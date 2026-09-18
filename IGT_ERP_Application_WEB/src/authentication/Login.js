import React, { useContext, useState } from "react";
import "./login.css";
import AuthContext from "../services/AuthContext";

function Login() {
  const { loginUser } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    console.log(username);
    console.log(password);

    await loginUser(e);
  };

  return (
    <div className="auth-login-page container-xxl">
      <div className="authentication-wrapper">
        <div className="authentication-inner">

          <div className="card">

            <div className="login-wrapper">

              {/* ================= LEFT SIDE ================= */}

              <div className="login-left">

                <div className="login-form">

                  {/* <div className="app-brand">
                    <span className="app-brand-text">
                      IGT ERP
                    </span>
                  </div> */}

                  <h2 className="login-title">
                    Sign In
                  </h2>

                  <p className="login-subtitle">
                    Enter your email and password to sign in
                  </p>

                  <form
                    id="formAuthentication"
                    onSubmit={handleSubmit}
                  >

                    {/* Username */}

                    <div className="mb-4">

                      <label className="form-label">
                        Email or Username
                      </label>

                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        placeholder="Enter your email or username"
                        required
                      />

                    </div>

                    {/* Password */}

                    <div className="mb-3">

                      <div className="d-flex justify-content-between mb-2">

                        <label className="form-label">
                          Password
                        </label>

                        <a href="/">
                          Forgot Password?
                        </a>

                      </div>

                      <div className="input-group">

                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          name="password"
                          placeholder="Enter your password"
                          required
                        />

                        <span
                          className="input-group-text"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                        >
                          <i
                            className={
                              showPassword
                                ? "bx bx-show"
                                : "bx bx-hide"
                            }
                          ></i>
                        </span>

                      </div>

                    </div>

                    {/* Remember 

                    <div className="mb-4">

                      <div className="form-check">

                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="remember"
                        />

                        <label
                          htmlFor="remember"
                          className="form-check-label"
                        >
                          Remember Me
                        </label>

                      </div>

                    </div>*/}

                    {/* Button */}

                    <button
                      className="btn btn-primary w-100"
                      type="submit"
                    >
                      Sign In
                    </button>

                  </form>

                </div>

              </div>

              {/* ================= RIGHT SIDE ================= */}

              <div className="login-right">

                <div className="login-overlay">

                  <div className="login-right-content">

                    <h2>
                      "Attention is the new currency"
                    </h2>

                    <p>
                      The more effortless the writing looks,
                      the more effort the writer actually put
                      into the process.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;