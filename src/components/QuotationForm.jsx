import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/Malik-logo.png";
import axios from "axios";
function QuotationForm() {
  const [sections, setSections] = useState([
    {
      title: "Section 1",
      supervision: 0,
      rows: [{ description: "", qty: "", rate: 0, total: 0 }]
    }
  ]);

  const [grandTotal, setGrandTotal] = useState(0);

  // ✅ NEW MANUAL FIELDS
  const [manualGrandTotal, setManualGrandTotal] = useState("");
  const [manualRoundedTotal, setManualRoundedTotal] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const [date, setDate] = useState("");
  const [client, setClient] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [event, setEvent] = useState("");
  const [venue, setVenue] = useState("");

  const companyAddress =
    "Malik Events, Behind Old Post Office\nPayyambalam, Kannur - 670001\nPhone: +91 999 55 966 22\nEmail: malikeventsin@gmail.com";

  const calculateRowTotal = (qty, rate) => {
    if (typeof qty === "string" && qty.includes("%")) {
      const percent = parseFloat(qty.replace("%", ""));
      return (percent / 100) * rate;
    }
    return Number(qty) * Number(rate);
  };

  const calculateSectionSubtotal = (section) => {
    
    let subtotal = 0;

    section.rows.forEach((row) => {
      subtotal += Number(row.total);
    });
     
    const supervisionAmount = (subtotal * section.supervision) / 100;
    return subtotal + supervisionAmount;
  };
  
  const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

  const handleChange = (sIndex, rIndex, field, value) => {
    const updated = [...sections];
    const row = updated[sIndex].rows[rIndex];

    row[field] = value;

    if (field === "qty" || field === "rate") {
      row.total = calculateRowTotal(row.qty, row.rate);
    }

    setSections(updated);
    calculateGrandTotal(updated);
  };

  const addRow = (sIndex) => {
    const updated = [...sections];
    updated[sIndex].rows.push({
      description: "",
      qty: "",
      rate: 0,
      total: 0
    });
    setSections(updated);
  };

  const deleteRow = (sIndex, rIndex) => {
    const updated = [...sections];
    updated[sIndex].rows.splice(rIndex, 1);
    setSections(updated);
    calculateGrandTotal(updated);
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Section ${sections.length + 1}`,
        supervision: 0,
        rows: [{ description: "", qty: "", rate: 0, total: 0 }]
      }
    ]);
  };

  const calculateGrandTotal = (data) => {
    let total = 0;

    data.forEach((section) => {
      total += calculateSectionSubtotal(section);
    });

    setGrandTotal(total);
  };

  // ✅ PDF
  const downloadPDF = async () => {
    try {
    const payload = {
      name: event || "Quotation",
      client,
      date,
      eventDate,
      venue,
      total: manualGrandTotal || grandTotal,
      rounded_total: manualRoundedTotal,
      amount_words: amountInWords,
      approved_by: approvedBy,
      sections: sections
    };

    const response = await axios.post(
      "https://event-management-n7xs7d73m-mishka7306s-projects.vercel.app/api/save-event",
      payload
    );

    console.log(response.data);
  } catch (error) {
    console.error(error);
    alert("Error saving data");
  }




    const doc = new jsPDF();
     await saveToDatabase();

    const getBase64Image = (img, callback) => {
      const reader = new FileReader();
      fetch(img)
        .then((res) => res.blob())
        .then((blob) => {
          reader.readAsDataURL(blob);
          reader.onloadend = () => callback(reader.result);
        });
    };

    getBase64Image(logo, (base64Img) => {
      doc.addImage(base64Img, "PNG", 14, 10, 30, 30);

      doc.setFontSize(16);
      doc.text("MALIK EVENTS", 50, 18);

      doc.setFontSize(10);
      doc.text(companyAddress, 50, 25);

      doc.text(`Date: ${formatDate(date)}`, 140, 15);
      doc.text(`Client: ${client}`, 140, 22);
      doc.text(`Event Date: ${formatDate(eventDate)}`, 140, 29);
      doc.text(`Event: ${event}`, 140, 36);
      doc.text(`Venue: ${venue}`, 140, 43);

      doc.line(14, 50, 195, 50);

      let currentY = 55;

      sections.forEach((section) => {
        doc.setFontSize(12);
        doc.text(section.title, 14, currentY);

        currentY += 5;

        const tableData = section.rows.map((row) => [
          row.description,
          row.qty,
          row.rate,
          row.total
        ]);

        autoTable(doc, {
          head: [["Description", "Quantity", "Unit Price", "Cost"]],
          body: tableData,
          startY: currentY,
          styles: { halign: "center" },
          headStyles: { fillColor: [44, 62, 80] }
        });

        currentY = doc.lastAutoTable.finalY + 5;

        const subtotal = calculateSectionSubtotal(section);

        doc.text(
          `Subtotal (incl. ${section.supervision}% supervision): ₹ ${subtotal}`,
          14,
          currentY
        );

        currentY += 10;
      });

      // ✅ USE MANUAL VALUES
      doc.text(`Grand Total: ₹ ${manualGrandTotal || "__________"}`, 14, currentY);
     doc.text(`Rounded To: ₹ ${manualRoundedTotal || "__________"}`, 14, currentY + 10);

     // ✅ Amount in Words
     doc.text(
    `Amount in Words: ${amountInWords || "________________________"}`,
     14,
    currentY + 20
    );




        // Move Y position down
    currentY += 35;

    // Title
    doc.setFontSize(12);
    doc.text("Terms & Conditions:", 14, currentY);

    // Content
    doc.setFontSize(10);

    const terms = [
      "1. Token advance of Rs.25,000 to be paid once the quote is accepted",
      "2. Initial Advance after confirmation will not be refunded.",
      "3. Payment Structure : 50% before 20 days, 25% before 7 days, balance to be paid on the day of the event.",
      "4. Any additional requirements apart from the ones agreed in the quotation will be charged extra",
      "5. No negotiations on the budget once the advance has been paid.",
      "6. Quotation will be valid for 5 days.",

    ];


    
    // Print each line
    terms.forEach((term, index) => {
      doc.text(term, 14, currentY + 6 + (index * 5));
    });


    // ✅ SPACE AFTER TERMS
currentY += 60;


// ✅ APPROVED BY SECTION
doc.setFontSize(11);
doc.text(`Approved By: ${approvedBy || "______________"}`, 14, currentY);
// Page break check
if (currentY > 260) {
  doc.addPage();
  currentY = 20;
}


      // doc.setFontSize(10);
      // doc.text("Thank you for choosing MALIK EVENTS", 14, currentY + 25);

      doc.save("quotation.pdf");
     });
     };

 const saveToDatabase = async () => {
  
};





    return (
    <div style={{ padding: "30px" }}>
      <h2>MALIK EVENTS</h2>

      <div style={{ marginBottom: "20px" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <input placeholder="Event" value={event} onChange={(e) => setEvent(e.target.value)} />
        <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
      </div>

      {sections.map((section, sIndex) => (
        <div key={sIndex} style={{ marginBottom: "30px" }}>
          <input
            value={section.title}
            onChange={(e) => {
              const updated = [...sections];
              updated[sIndex].title = e.target.value;
              setSections(updated);
            }}
          />

          <table border="1" width="100%" cellPadding="10">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Cost</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {section.rows.map((row, rIndex) => (
                <tr key={rIndex}>
                  <td>
                    <input
                      value={row.description}
                      onChange={(e) =>
                        handleChange(sIndex, rIndex, "description", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      placeholder="10 or 10%"
                      value={row.qty}
                      onChange={(e) =>
                        handleChange(sIndex, rIndex, "qty", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) =>
                        handleChange(sIndex, rIndex, "rate", e.target.value)
                      }
                    />
                  </td>

                  <td>{row.total}</td>

                  <td>
                    <button onClick={() => deleteRow(sIndex, rIndex)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "10px" }}>
            <label>
              Supervision (%):
              <input
                type="number"
                value={section.supervision}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[sIndex].supervision = Number(e.target.value);
                  setSections(updated);
                  calculateGrandTotal(updated);
                }}
              />
            </label>
          </div>

          <h4>
            Subtotal (incl. supervision): ₹ {calculateSectionSubtotal(section)}
          </h4>

          <button onClick={() => addRow(sIndex)}>+ Add Row</button>
        </div>
      ))}

      <button onClick={addSection}>+ Add Table</button>

      {/* ✅ MANUAL INPUTS */}
      <h3>Calculated Total (Reference): ₹ {grandTotal}</h3>

      <div style={{ marginTop: "20px" }}>
        <label>
          Grand Total:
          <input
            value={manualGrandTotal}
            onChange={(e) => setManualGrandTotal(e.target.value)}
            placeholder="Enter final amount"
          />
        </label>
      </div>

      <div>
        <label>
  Rounded To:
  <input
    value={manualRoundedTotal}
    onChange={(e) => setManualRoundedTotal(e.target.value)}
    placeholder="Enter rounded value"
  />
</label>

<br /><br />

<label>
  Amount in Words:
  <input
    value={amountInWords}
    onChange={(e) => setAmountInWords(e.target.value)}
    placeholder="e.g. Twenty Four Rupees Only"
    style={{ width: "300px" }}
  />
</label>
    
    <div style={{ marginTop: "10px" }}>
  <label>
    Approved By:
    <input
      value={approvedBy}
      onChange={(e) => setApprovedBy(e.target.value)}
      placeholder="Enter name"
      style={{ marginLeft: "10px" }}
    />
  </label>
</div>


      </div>

      <button style={{ marginTop: "20px",color: "blue" }} onClick={downloadPDF}>
        Download PDF
      </button>
      
    </div>

        
    
  );
  
}


export default QuotationForm;