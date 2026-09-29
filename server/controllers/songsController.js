

const getSongs = async (req, res) => {
    try{
        console.log("testing get songs")
        res.json({ message: "testing get songs" });
    }
    catch (err) {
        console.log(err)
    }
}

const uploadSong = async (req, res) => {
    try{
          console.log(req.file);

          res.json({
              message: "File uploaded!",
              file: req.file,
          });
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = { getSongs, uploadSong }