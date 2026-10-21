const Song = require("../models/Song");

const getSongs = async (req, res) => {
    try{
        const songs = await Song.find();
        res.json({
            songs: songs.map((song) => ({
                id: song.songId,
                title: song.title,
                artist: song.artist,
                arranger: song.arranger,
                coverColor: song.coverColor,
                coverImage: song.coverImage,
                stars: song.stars,
                length: song.length,
                notes: song.notes,
            })),
        });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal server error" });
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