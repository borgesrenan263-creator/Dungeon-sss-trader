const express = require("express");
const router = express.Router();

const {
  getWorldMap,
  getSectorDetails
} = require("../../repositories/map.repository");

router.get("/world", async(req,res)=>{

  try{

    const sectors = await getWorldMap();

    res.json({
      ok:true,
      total:sectors.length,
      sectors
    });

  }catch(error){

    res.status(500).json({
      ok:false,
      error:error.message
    });

  }

});

router.get("/sector/:sectorId", async(req,res)=>{

  try{

    const sector = await getSectorDetails(req.params.sectorId);

    res.json({
      ok:true,
      sector
    });

  }catch(error){

    res.status(400).json({
      ok:false,
      error:error.message
    });

  }

});

module.exports = router;
