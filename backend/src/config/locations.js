// Comprehensive Indian State, District, and City location database
const INDIA_LOCATIONS = [
  {
    state: "Telangana",
    districts: [
      { name: "Hyderabad", cities: ["Hyderabad", "Secunderabad", "Gachibowli", "Madhapur", "Kukatpally", "Banjara Hills"] },
      { name: "Rangareddy", cities: ["Shamshabad", "Rajendranagar", "Ibrahimpatnam"] },
      { name: "Medchal-Malkajgiri", cities: ["Kompally", "Malkajgiri", "Alwal"] },
      { name: "Warangal", cities: ["Warangal", "Hanamkonda", "Kazipet"] },
      { name: "Karimnagar", cities: ["Karimnagar", "Jagtial"] },
      { name: "Nizamabad", cities: ["Nizamabad", "Bodhan"] },
      { name: "Khammam", cities: ["Khammam", "Kothagudem"] }
    ]
  },
  {
    state: "Andhra Pradesh",
    districts: [
      { name: "Visakhapatnam", cities: ["Visakhapatnam", "Gajuwaka", "Anakapalle"] },
      { name: "Krishna", cities: ["Vijayawada", "Machilipatnam", "Gudivada"] },
      { name: "Guntur", cities: ["Guntur", "Tenali", "Narasaraopet"] },
      { name: "Tirupati", cities: ["Tirupati", "Srikalahasti"] },
      { name: "Kurnool", cities: ["Kurnool", "Nandyal", "Adoni"] },
      { name: "East Godavari", cities: ["Rajahmundry", "Kakinada"] }
    ]
  },
  {
    state: "Karnataka",
    districts: [
      { name: "Bengaluru Urban", cities: ["Bengaluru", "Whitefield", "Electronic City", "Indiranagar", "Koramangala", "Jayanagar"] },
      { name: "Mysuru", cities: ["Mysuru", "Nanjangud", "Hunsur"] },
      { name: "Dakshina Kannada", cities: ["Mangaluru", "Bantwal", "Puttur"] },
      { name: "Dharwad", cities: ["Hubballi", "Dharwad"] },
      { name: "Belagavi", cities: ["Belagavi", "Gokak"] }
    ]
  },
  {
    state: "Maharashtra",
    districts: [
      { name: "Mumbai City", cities: ["Mumbai", "Colaba", "Dadar", "Nariman Point"] },
      { name: "Mumbai Suburban", cities: ["Andheri", "Bandra", "Borivali", "Goregaon"] },
      { name: "Pune", cities: ["Pune", "Pimpri-Chinchwad", "Hinjawadi", "Hadapsar", "Kothrud"] },
      { name: "Thane", cities: ["Thane", "Navi Mumbai", "Kalyan", "Dombivli"] },
      { name: "Nagpur", cities: ["Nagpur", "Kamptee"] },
      { name: "Nashik", cities: ["Nashik", "Deolali", "Malegaon"] }
    ]
  },
  {
    state: "Tamil Nadu",
    districts: [
      { name: "Chennai", cities: ["Chennai", "Adyar", "T. Nagar", "Velachery", "Anna Nagar"] },
      { name: "Coimbatore", cities: ["Coimbatore", "Pollachi", "Mettupalayam"] },
      { name: "Madurai", cities: ["Madurai", "Melur"] },
      { name: "Tiruchirappalli", cities: ["Tiruchirappalli", "Srirangam"] },
      { name: "Salem", cities: ["Salem", "Attur"] }
    ]
  },
  {
    state: "Delhi",
    districts: [
      { name: "New Delhi", cities: ["Connaught Place", "Chanakyapuri"] },
      { name: "South Delhi", cities: ["Hauz Khas", "Saket", "Greater Kailash"] },
      { name: "North Delhi", cities: ["Civil Lines", "Rohini", "Model Town"] },
      { name: "West Delhi", cities: ["Janakpuri", "Rajouri Garden", "Punjabi Bagh"] },
      { name: "East Delhi", cities: ["Laxmi Nagar", "Mayur Vihar", "Preet Vihar"] }
    ]
  },
  {
    state: "Kerala",
    districts: [
      { name: "Ernakulam", cities: ["Kochi", "Ernakulam", "Aluva"] },
      { name: "Thiruvananthapuram", cities: ["Thiruvananthapuram", "Neyyattinkara"] },
      { name: "Kozhikode", cities: ["Kozhikode", "Vadakara"] },
      { name: "Thrissur", cities: ["Thrissur", "Chalakudy"] }
    ]
  },
  {
    state: "Gujarat",
    districts: [
      { name: "Ahmedabad", cities: ["Ahmedabad", "Sanand"] },
      { name: "Surat", cities: ["Surat", "Bardoli"] },
      { name: "Vadodara", cities: ["Vadodara", "Padra"] },
      { name: "Rajkot", cities: ["Rajkot", "Gondal"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    districts: [
      { name: "Gautam Buddha Nagar", cities: ["Noida", "Greater Noida"] },
      { name: "Lucknow", cities: ["Lucknow", "Malihabad"] },
      { name: "Kanpur Nagar", cities: ["Kanpur", "Bilhaur"] },
      { name: "Varanasi", cities: ["Varanasi", "Pindra"] }
    ]
  },
  {
    state: "West Bengal",
    districts: [
      { name: "Kolkata", cities: ["Kolkata", "Salt Lake", "New Town", "Howrah"] },
      { name: "North 24 Parganas", cities: ["Barasat", "Barrackpore"] }
    ]
  },
  {
    state: "Rajasthan",
    districts: [
      { name: "Jaipur", cities: ["Jaipur", "Sanganer"] },
      { name: "Jodhpur", cities: ["Jodhpur", "Phalodi"] },
      { name: "Udaipur", cities: ["Udaipur"] }
    ]
  }
];

module.exports = {
  INDIA_LOCATIONS
};
