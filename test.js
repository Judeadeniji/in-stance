const { createDatabase, Model, Schema } = require("./main");

createDatabase("testing")

const ContactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Unknown rClient",
      minlength: 3,
      unique: true
    },
    message: {
      type: String,
      required: true,
      minlength: 2,
    }
  },
  { timestamps: true }
);

const ContactModel = new Model('contact', ContactSchema);

(async () => {
  try {
   const created = await ContactModel.create({
     name: 'Neymar',
     message: 'World Cup'
   })
   const updated = await ContactModel.update({
     name: 'Neymar',
   }, {
     message: 'No world cup'
   })
   const deleted = await ContactModel.delete({
     name: 'Neymar',
   }, () => console.log("deleted successfully "))
  console.log(await ContactModel.getAll())
  } catch (e) {
    console.error(e)
  }
})()
