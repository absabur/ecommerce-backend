exports.jwtToken = (token,res) => {
    return res.cookie("access_token", token, {
        maxAge: process.env.COOKIE_EXPIRE*24*60*60*1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    })
}
