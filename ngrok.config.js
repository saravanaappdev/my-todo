export default {
  authtoken: "2sLB9WrWizGVsua3T82LyVvurT0_5mujp2oDJfcRH5isoFxDA", // Get this from ngrok.com after signing up
  tunnels: {
    expo: {
      proto: "http",
      addr: 19000,
      bind_tls: true,
    },
    web: {
      proto: "http",
      addr: 19006,
      bind_tls: true,
    },
  },
};
