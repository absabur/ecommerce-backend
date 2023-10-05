exports.jwtToken = (token,res) => {
    return res.cookie("access_token", token, {
        maxAge: 10*60*1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    })
}
