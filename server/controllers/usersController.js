

const getUser = async (req, res) => {
    try{
        console.log("testing get user")
        res.json({ message: "testing get user" });
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = { getUser }