const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ariigraphies@gmail.com",
    pass: "mdmk sndw zvbk nslo"
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.get("/", (req,res)=>{
  res.sendFile(__dirname + "/public/index.html");
});


const db = new sqlite3.Database("./bookings.db");

db.run(`
CREATE TABLE IF NOT EXISTS bookings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  time INTEGER,
  duration INTEGER,
  name TEXT,
  lastname TEXT,
  email TEXT,
  phone TEXT,
  status TEXT
)
`);

/* CREAR RESERVA */
app.post("/book", (req, res) => {
  const { date, time, duration, name, lastname, email, phone } = req.body;

  db.run(
    `INSERT INTO bookings (date,time,duration,name,lastname,email,phone,status)
     VALUES (?,?,?,?,?,?,?,?)`,
    [date, time, duration, name, lastname, email, phone, "pending"],
    (err)=>{
  if(err){
    console.log(err);
    return res.status(500).send("Error DB");
  }

  // 📅 FORMATEAR FECHA A DD/MM/YYYY
const partes = date.split("-");
const fechaBonita = `${partes[2]}/${partes[1]}/${partes[0]}`;

  // ✉️ EMAIL CLIENTE RESERVA CREADA
transporter.sendMail({
  from: "TUEMAIL@gmail.com",
  to: email,
  subject: "Reserva recibida ✔",
  html: `
    <div style="font-family:Montserrat, Arial; font-size:14px; color:#333">
      <p><strong>Tu reserva ha sido creada</strong></p>

      <p>
        📅 <b>Fecha:</b> ${date}<br>
        🕒 <b>Hora:</b> ${time}:00
      </p>

      <p>
        En las próximas <b>24-48 horas</b> recibirás un correo indicando la 
        <b>confirmación o modificación</b> de la reserva.
      </p>

      <p>Gracias ✨</p>

      <hr style="margin-top:25px; border:none; border-top:1px solid #ddd">

      
    <p style="font-size:14px; color:#777; text-align:left; margin-top:10px">
      <strong>Ariigraphies</strong><br>
      Capturing moments, creating memories
    </p>

    </div>
  `
});


  });

  res.json({ok:true});
}

  );

/* GET RESERVAS */
app.get("/bookings",(req,res)=>{
  db.all("SELECT * FROM bookings",[],(err,rows)=>{
    res.json(rows);
  });
});

/* CONFIRMAR */
app.post("/confirm/:id",(req,res)=>{

  db.get("SELECT * FROM bookings WHERE id=?", [req.params.id], (err,row)=>{

    if(row){

      // actualizar estado
      db.run("UPDATE bookings SET status='confirmed' WHERE id=?", [req.params.id]);

      // 📧 EMAIL CONFIRMACIÓN
      transporter.sendMail({
        from: "TUEMAIL@gmail.com",
        to: row.email,
        subject: "Reserva confirmada ✔",
        html: `
          <div style="font-family:Montserrat, Arial; font-size:14px; color:#333">
            <p><strong>Tu reserva está confirmada 🎉</strong></p>

            <p>
              📅 <b>Fecha:</b> ${row.date}<br>
              🕒 <b>Hora:</b> ${row.time}:00
            </p>

            <p>
              En breve recibirás un WhatsApp al teléfono <b>${row.phone}</b>
              con toda la información de la reserva.
            </p>

            <p>Gracias por confiar en Ariigraphies✨</p>

            <hr style="margin-top:25px; border:none; border-top:1px solid #ddd">


    <p style="font-size:14px; color:#777; text-align:left; margin-top:10px">
      <strong>Ariigraphies</strong><br>
      Capturing moments, creating memories
    </p>

          </div>
        `
      });

    }

    res.json({ok:true});
  });

});


/* ELIMINAR */
app.post("/delete/:id",(req,res)=>{

  db.get("SELECT * FROM bookings WHERE id=?", [req.params.id], (err,row)=>{

    if(row){

      // 📧 EMAIL DE RECHAZO
      transporter.sendMail({
  from: "TUEMAIL@gmail.com",
  to: row.email,
  subject: "Solicitud de reserva ❌",
  html: `
  <div style="font-family:Montserrat, Arial; font-size:14px; color:#333">

    <p><strong>Tu solicitud de reserva no ha podido ser confirmada ❌</strong></p>

    <p>La fecha y hora seleccionadas ya no están disponibles.</p>

    <p>
      Puedes escoger otra fecha y hora desde la agenda o,
      si lo prefieres, contactar directamente conmigo para encontrar una alternativa.
    </p>

    <p>Gracias por tu comprensión 🙏</p>

    <hr style="margin-top:25px; border:none; border-top:1px solid #ddd">

    <p style="font-size:14px; color:#777; text-align:left; margin-top:10px">
      <strong>Ariigraphies</strong><br>
      Capturing moments, creating memories
    </p>

  </div>
  `
});


      // 🗑️ borrar después
      db.run("DELETE FROM bookings WHERE id=?", [req.params.id]);
    }

    res.json({ok:true});
  });

});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo en " + PORT));


