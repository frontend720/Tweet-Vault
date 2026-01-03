//   const [accountIndex, setAccountIndex] = useState(0);
//   const accounts = ["NASA", "NatGeo", "ArchDaily", "RedBull", "HumansOfNY"];

//   useEffect(() => {
//     if (mediaArray.length === 0) {
//       return;
//     } else {
//       const intervalId = setInterval(() => {
//         setAccountIndex((prev) => (prev + 1) % accounts.length);
//       }, 3000);
//       () => clearInterval(intervalId);
//     }
//   }, []);

//   const accountRef = useRef(null);
//   useEffect(() => {
//     if (mediaArray.length === 0) {
//       return;
//     } else {
//       gsap.to(accountRef.current, {
//         opacity: 1,
//         duration: 1,
//       });
//       gsap.to(accountRef.current, {
//         delay: 2.5,
//         opacity: 0,
//         duration: 0.5,
//       });
//     }
//   }, [accountIndex]);