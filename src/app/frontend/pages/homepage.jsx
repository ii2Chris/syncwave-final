import React, { useState } from "react";
import { Box, Button, Typography, Grid, AppBar, Toolbar, CssBaseline } from "@mui/material";
//import LoginModal from "../../components/loginmodal/LoginModal";
import background from '../../../../src/background.webp';
const Homepage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const artists = [
    { name: "TEMP", type: "ARTIST", image: "" },
    { name: "TEMP", type: "ARTIST", image: "" },
    { name: "TEMP", type: "ARTIST", image: "" },
    { name: "TEMP", type: "ARTIST", image: "" },
    { name: "TEMP", type: "ARTIST", image: "" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "black", color: "white" }}>
      <CssBaseline />

      {/* Navbar */}
      <AppBar position="fixed" sx={{ backgroundImage: "linear-gradient(Black, #020102)" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" component="a" href="/" sx={{ color: "#bb86fc", textDecoration: "none" }}>
            Cert Gram
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "white",
                marginRight: 2,
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.5)" },
              }}
              onClick={() => setIsModalOpen(true)}
            >
              Log In
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#9d52f8",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.5)" },
              }}
              onClick={() => setIsModalOpen(true)}
            >
              Sign Up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        sx={{
          position: "fixed",
          top: 64,
          left: 0,
          width: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
          gap: 3,
        }}
      >
        {["PROFILE", "CHATS", "FRIENDS"].map((item) => (
          <Box key={item} sx={{ textAlign: "center", cursor: "pointer" }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "white",
                mb: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: 16 }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ ml: 120, pt: 10 }}>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            height: 400,
            display: "flex",
            alignItems: "center",
            p: 4,
            mb: 4,
            backgroundImage: "url(background}",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Box>
            <Typography variant="h1" sx={{ color: "#bb86fc", fontSize: "4rem", lineHeight: 1.2 }}>
              <Box component="span" display="block">
                MEET
              </Box>
              <Box component="span" display="block">
                YOUR
              </Box>
              <Box component="span" display="block">
                CONCERT
              </Box>
              <Box component="span" display="block">
                CREW
              </Box>
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 600 }}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum delectus, ipsam
              adipisci unde impedit ratione, praesentium nisi rem illo deserunt ea quis nesciunt
              necessitatibus enim molestiae sint similique quisquam quae?
            </Typography>
          </Box>
          <Button
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              px: 4,
              py: 1,
              bgcolor: "#9d52f8",
              color: "white",
              borderRadius: 25,
              fontWeight: "bold",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.5)" },
            }}
          >
            NEAR ME
          </Button>
        </Box>

        {/* Events Section */}
        <Box>
          <Typography variant="h4" sx={{ mb: 2, position: "relative", "::after": { content: '""', position: "absolute", bottom: -10, left: 0, width: "100%", height: 2, background: "linear-gradient(to right, #bb86fc, transparent)" } }}>
            UPCOMING EVENTS
          </Typography>
          <Grid container spacing={3}>
            {artists.map((artist, index) => (
              <Grid key={index} item xs={6} sm={4} md={2}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      bgcolor: "#333",
                      mx: "auto",
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ fontSize: "1rem", mb: 0.5 }}>
                    {artist.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.9rem", color: "#888" }}>{artist.type}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

   {/*  <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />*/}
    </Box>
  );
};

export default Homepage;
