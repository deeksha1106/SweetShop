'use client';

import React, { useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Store, AdminPanelSettings, Security, Speed } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import * as THREE from 'three';

const HomePage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;


    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);


    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x8B4513 }),
      new THREE.MeshBasicMaterial({ color: 0xD2691E }),
      new THREE.MeshBasicMaterial({ color: 0xCD853F }),
      new THREE.MeshBasicMaterial({ color: 0xF4A460 }),
      new THREE.MeshBasicMaterial({ color: 0x20B2AA }),
      new THREE.MeshBasicMaterial({ color: 0xDDA0DD }),
    ];

    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 50; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.x = (Math.random() - 0.5) * 20;
      particle.position.y = (Math.random() - 0.5) * 20;
      particle.position.z = (Math.random() - 0.5) * 20;
      
      particles.push(particle);
      scene.add(particle);
    }

    camera.position.z = 5;


    const animate = () => {
      requestAnimationFrame(animate);
      
      particles.forEach((particle, index) => {
        particle.rotation.x += 0.01;
        particle.rotation.y += 0.01;
        particle.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
        particle.position.x += Math.cos(Date.now() * 0.001 + index) * 0.001;
      });
      
      renderer.render(scene, camera);
    };

    animate();


    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const features = [
    {
      icon: <Store />,
      title: 'Premium Sweets',
      description: 'Discover our curated collection of premium chocolates, candies, and gourmet treats.',
    },
    {
      icon: <Security />,
      title: 'Secure Shopping',
      description: 'Shop with confidence using our secure authentication and payment systems.',
    },
    {
      icon: <Speed />,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to satisfy your sweet cravings in no time.',
    },
    {
      icon: <AdminPanelSettings />,
      title: 'Admin Dashboard',
      description: 'Comprehensive inventory management and analytics for administrators.',
    },
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Three.js Background */}
      <Box
        ref={mountRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            sx={{
              height: { xs: 240, md: 360 },
              mb: 6,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              backgroundImage: `linear-gradient(rgba(18,12,10,0.27), rgba(18,12,10,0.55)), url('https://plus.unsplash.com/premium_photo-1681488399071-08df24fbd217?q=80&w=1098&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(245, 230, 211, 0.08)',
            }}
          />
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mb: 6,
            flexWrap: 'wrap',
          }}>
            {[
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36d.png', // lollipop
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png', // candy
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f369.png', // donut
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36b.png', // chocolate bar
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36a.png', // cookie
              'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36f.png', // honey pot
            ].map((url, idx) => (
              <Box key={url}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 230, 211, 0.06)',
                  border: '1px solid rgba(245, 230, 211, 0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  backgroundImage: `url(${url})`,
                  backgroundSize: '36px 36px',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${idx % 2 === 0 ? 0 : 6}deg)`,
                }}
              />
            ))}
          </Box>
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 800,
                mb: 3,
              }}
            >
              Welcome to <Box component="span" sx={{ color: 'secondary.light', background: 'none', WebkitBackgroundClip: 'initial', WebkitTextFillColor: 'currentColor', fontFamily: '"Modern Aesthetic Serif Font", "Playfair Display", serif' }}>Sweet Shop</Box>
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              paragraph
              sx={{
                maxWidth: 700,
                mx: 'auto',
                mb: 6,
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                fontWeight: 300,
                lineHeight: 1.6,
                letterSpacing: '0.5px',
              }}
            >
              Indulge in our exquisite collection of artisanal sweets, premium chocolates, and handcrafted confectionery delights.
              Where centuries-old traditions meet modern culinary artistry.
            </Typography>
            
            {/* Premium Badge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Chip
                label="✨ Premium Artisanal Quality ✨"
                sx={{
                  background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.2), rgba(210, 105, 30, 0.15))',
                  color: 'secondary.light',
                  border: '1px solid rgba(139, 69, 19, 0.3)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  backdropFilter: 'blur(8px)',
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
              {isAuthenticated ? (
                <>
                  <Button
                    component={Link}
                    href="/shop"
                    variant="contained"
                    size="large"
                    sx={{ 
                      px: 6, 
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                      boxShadow: '0 8px 32px rgba(139, 69, 19, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #654321, #A0522D)',
                        boxShadow: '0 12px 40px rgba(139, 69, 19, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    🍭 Browse Our Collection
                  </Button>
                  {isAdmin && (
                    <Button
                      component={Link}
                      href="/admin"
                      variant="outlined"
                      size="large"
                      sx={{ 
                        px: 6, 
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderColor: 'secondary.main',
                        color: 'secondary.light',
                        '&:hover': {
                          borderColor: 'secondary.light',
                          backgroundColor: 'rgba(139, 69, 19, 0.1)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      ⚙️ Admin Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/auth/register"
                    variant="contained"
                    size="large"
                    sx={{ 
                      px: 6, 
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                      boxShadow: '0 8px 32px rgba(139, 69, 19, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #654321, #A0522D)',
                        boxShadow: '0 12px 40px rgba(139, 69, 19, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    🎉 Join Sweet Shop
                  </Button>
                  <Button
                    component={Link}
                    href="/auth/login"
                    variant="outlined"
                    size="large"
                    sx={{ 
                      px: 6, 
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderColor: 'secondary.main',
                      color: 'secondary.light',
                      '&:hover': {
                        borderColor: 'secondary.light',
                        backgroundColor: 'rgba(139, 69, 19, 0.1)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    👋 Welcome Back
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              sx={{ 
                mb: 2,
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.75rem' },
                background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Why Choose Sweet Shop?
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 300,
                letterSpacing: '0.5px',
              }}
            >
              Discover what makes our confectionery experience truly exceptional
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'center',
                      p: 4,
                      background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))',
                      border: '1px solid rgba(139, 69, 19, 0.15)',
                      borderRadius: 3,
                      backdropFilter: 'blur(16px)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 60px rgba(139, 69, 19, 0.2)',
                        border: '1px solid rgba(139, 69, 19, 0.25)',
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 3,
                          color: 'secondary.main',
                          background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.08))',
                          borderRadius: '50%',
                          width: 80,
                          height: 80,
                          alignItems: 'center',
                          mx: 'auto',
                          border: '2px solid rgba(139, 69, 19, 0.2)',
                        }}
                      >
                        {React.cloneElement(feature.icon, { sx: { fontSize: 40 } })}
                      </Box>
                      <Typography 
                        variant="h5" 
                        component="h3" 
                        gutterBottom 
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: 'secondary.light',
                          fontSize: { xs: '1.3rem', md: '1.5rem' },
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.7,
                          fontSize: '1rem',
                          fontWeight: 300,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Box sx={{ mt: 16, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                mb: 2,
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Sweet Statistics
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 8,
                fontWeight: 300,
                letterSpacing: '0.5px',
              }}
            >
              Numbers that speak to our commitment to excellence
            </Typography>
            
            <Grid container spacing={4}>
              {[
                { number: '1000+', label: 'Happy Customers' },
                { number: '50+', label: 'Sweet Varieties' },
                { number: '99.9%', label: 'Satisfaction Rate' },
                { number: '24/7', label: 'Sweet Support' },
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.08))',
                        borderRadius: 3,
                        p: 4,
                        border: '1px solid rgba(139, 69, 19, 0.15)',
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(139, 69, 19, 0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography
                        variant="h2"
                        component="div"
                        sx={{
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 1,
                          fontSize: { xs: '2.5rem', md: '3rem' },
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Box
            sx={{
              mt: 16,
              p: 8,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.2), rgba(210, 105, 30, 0.15))',
              borderRadius: 4,
              border: '2px solid rgba(139, 69, 19, 0.3)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(245, 230, 211, 0.05) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            }}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #8B4513, #D2691E, #CD853F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative',
                zIndex: 1,
              }}
            >
              🍫 Ready to Satisfy Your Sweet Tooth? 🍭
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph 
              sx={{ 
                mb: 6,
                fontWeight: 300,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                lineHeight: 1.6,
                letterSpacing: '0.5px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Join thousands of delighted customers and embark on a journey of exquisite flavors and artisanal craftsmanship.
            </Typography>
            
            {!isAuthenticated && (
              <Button
                component={Link}
                href="/auth/register"
                variant="contained"
                size="large"
                sx={{
                  px: 8,
                  py: 3,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                  boxShadow: '0 12px 40px rgba(139, 69, 19, 0.3)',
                  borderRadius: 3,
                  position: 'relative',
                  zIndex: 1,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #654321, #A0522D)',
                    boxShadow: '0 16px 50px rgba(139, 69, 19, 0.5)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                ✨ Start Your Sweet Journey ✨
              </Button>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HomePage;
