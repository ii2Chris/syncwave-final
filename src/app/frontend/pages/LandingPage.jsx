import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Tilt } from 'react-tilt';
import { FaUsers, FaTicketAlt, FaHeart } from 'react-icons/fa';
import { IoMusicalNotes } from 'react-icons/io5';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { TypeAnimation } from 'react-type-animation';
import { Parallax, ParallaxLayer } from '@react-spring/parallax';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

const GradientText = styled(motion.span)`
  background: linear-gradient(to right, #8B5CF6, #EC4899, #8B5CF6);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
  font-weight: 900;
  letter-spacing: -2px;
  filter: drop-shadow(0 0 2em rgba(139, 92, 246, 0.3));
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
`;

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Tilt options={{ max: 25, scale: 1.05, speed: 1000 }}>
    <GlassCard
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 4, height: '100%', textAlign: 'center' }}>
        <motion.div
          whileHover={{ 
            rotate: 360,
            scale: 1.2,
            filter: 'drop-shadow(0 0 0.5em #EC4899)'
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon size={40} style={{ color: '#EC4899', marginBottom: '1rem' }} />
        </motion.div>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white',
            mb: 2,
            fontWeight: 600,
            background: 'linear-gradient(45deg, #fff, #f0f0f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {description}
        </Typography>
      </Box>
    </GlassCard>
  </Tilt>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const parallaxRef = useRef();
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const features = [
    {
      icon: FaUsers,
      title: "Find Your Concert Crew",
      description: "Connect with people who share your music taste and concert plans"
    },
    {
      icon: FaTicketAlt,
      title: "Concert Matching",
      description: "Match with others going to the same concerts and events"
    },
    {
      icon: IoMusicalNotes,
      title: "Music Compatibility",
      description: "Find friends based on your favorite artists and genres"
    },
    {
      icon: FaHeart,
      title: "Create Connections",
      description: "Build lasting friendships through shared musical experiences"
    }
  ];

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <Canvas style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}>
        <Stars radius={300} depth={60} count={1000} factor={7} saturation={0} fade />
      </Canvas>

      <Parallax pages={2} ref={parallaxRef}>
        <ParallaxLayer offset={0} speed={0.5}>
          <Box
            sx={{
              minHeight: '100vh',
              background: `url('/src/background.webp') no-repeat center center fixed`,
              backgroundSize: 'cover',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                zIndex: 1,
              },
            }}
          >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
              <Grid container spacing={4} sx={{ minHeight: '100vh' }}>
                <Grid item xs={12} sx={{ mt: 15, textAlign: 'center' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <GradientText
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ 
                        backgroundPosition: {
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear"
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      style={{
                        fontSize: '5rem',
                        marginBottom: '1rem',
                        display: 'block'
                      }}
                    >
                      Cert Gram
                    </GradientText>

                    <TypeAnimation
                      sequence={[
                        'Find Your Perfect Concert Crew',
                        2000,
                        'Connect with Music Lovers',
                        2000,
                        'Share Concert Experiences',
                        2000,
                      ]}
                      wrapper="h2"
                      speed={50}
                      style={{
                        fontSize: '2.5rem',
                        color: 'white',
                        marginBottom: '2rem'
                      }}
                      repeat={Infinity}
                    />

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 4,
                          color: 'rgba(255, 255, 255, 0.8)',
                          maxWidth: '800px',
                          mx: 'auto'
                        }}
                      >
                        Connect with concert-goers who share your music taste. 
                        Make friends, share experiences, and never enjoy a concert alone again.
                      </Typography>
                    </motion.div>

                    {/* Enhanced Button Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        whileTap={{ scale: 0.95 }}
                        style={{
                          position: 'relative',
                          display: 'inline-block'
                        }}
                      >
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50px',
                            background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
                            filter: 'blur(15px)',
                            opacity: 0.5,
                            zIndex: -1,
                          }}
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => navigate('/signup')}
                          sx={{
                            background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
                            borderRadius: '50px',
                            px: 8,
                            py: 2.5,
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            textTransform: 'none',
                            border: '2px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.4)',
                            overflow: 'hidden',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transform: 'translateX(-100%)',
                            },
                            '&:hover': {
                              background: 'linear-gradient(45deg, #7C3AED, #DB2777)',
                              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.6)',
                              '&::before': {
                                transform: 'translateX(100%)',
                                transition: 'transform 0.75s ease-in-out',
                              },
                            },
                          }}
                        >
                          Start Matching
                        </Button>
                      </motion.div>
                    </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </ParallaxLayer>

        <ParallaxLayer offset={1} speed={0.8}>
          <Container maxWidth="lg">
            <Swiper
              effect={'cards'}
              grabCursor={true}
              modules={[EffectCards, Autoplay]}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              className="mySwiper"
            >
              {features.map((feature, index) => (
                <SwiperSlide key={index}>
                  <FeatureCard {...feature} />
                </SwiperSlide>
              ))}
            </Swiper>
          </Container>
        </ParallaxLayer>
      </Parallax>
    </Box>
  );
};

export default LandingPage; 