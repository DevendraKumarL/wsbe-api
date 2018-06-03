const express = require("express"),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	ObjectID = require("mongodb").ObjectID,
	WSReport = require("./models/report"),
	DraftReport = require("./models/draft"),
	errorMessages = require("./errorMessages");

const app = express();

app.use(bodyParser.json());

const appPort = 5000;

let isConnectedToDB = false;
const dbURL = "mongodb://localhost:27017/wsdb"
mongoose.connect(dbURL);

let db = mongoose.connection;
db.on('error', (err) => {
	console.error.bind(err, "Mongodb connection error");
	isConnectedToDB = false;
});
db.on('open', () => {
	console.log("Mongodb connection successful");
	isConnectedToDB = true;
});

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
	res.setHeader("Access-Control-Allow-Credentials", true);
	next();
});

app.post("/wsbe/report", (request, response) => {
	// Delete draft report first
	DraftReport.findAll((err, drafts) => {
		let msg = errorMessages.fetchDraftReportError;
		if (err) {
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		if (drafts[0]._id !== undefined) {
			
			DraftReport.findByIdAndRemove(drafts[0]._id, (error, draft) => {
				if (error) {
					let msg = errorMessages.deleteDraftError;
					console.log(msg);
					return response.status(500).json({error: msg});
				}
				
				let data = {
					report_date: request.body.report_date,
						ws_start: request.body.ws_start,
					ws_end: request.body.ws_end,
					bugzillaURL: request.body.bugzillaURL,
					highlights: request.body.highlights,
					codeReviews: request.body.codeReviews,
					planForWeek: request.body.planForWeek
				};
				console.log("Main Report data: ", data);
				let report = new WSReport(data);
				report.save((err, report) => {
					if (err) {
						let msg = errorMessages.saveReportError;
						console.log(msg);
						return response.status(500).json({error: msg})
					}
					return response.json({success: "A new report recorded successfully"});
				});
			});
		}
		else {
			return response.status(500).json({error: msg});
		}
	});
});

app.get("/wsbe/reports", (request, response) => {
	WSReport.findAll((err, reports) => {
		if (err) {
			let msg = errorMessages.fetchReportsError;
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		return response.json(reports);
	});
});

app.post("/wsbe/draft", (request, response) => {
	// Check if a draft report already exsits
	DraftReport.findAll((err, report) => {
		console.log("Draft report: ", request.body);
		if (err) {
			let msg = errorMessages.fetchDraftReportError;
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		if (report.length > 0 ){
			let msg = errorMessages.draftExists;
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		
		let data = {
			report_date: request.body.report_date,
			ws_start: request.body.ws_start,
			ws_end: request.body.ws_end,
			bugzillaURL: request.body.bugzillaURL,
			highlights: request.body.highlights,
			codeReviews: request.body.codeReviews,
			planForWeek: request.body.planForWeek
		};
		let draft = new DraftReport(data);
		draft.save((err, draft) => {
			if (err) {
				let msg = errorMessages.saveDraftError;
				console.log(msg);
				return response.status(500).json({error: msg});
			}
			return response.json({success: "A new draft report recorded successfully"});
		});
	});
});

app.put("/wsbe/draft", (request, response) => {
	console.log("Update draft: ", request.body);
	DraftReport.findAll((err, drafts) => {
		let msg = errorMessages.fetchDraftReportError;
		if (err) {
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		if (drafts[0]._id !== undefined) {
			DraftReport.findByIdAndUpdate(drafts[0]._id, request.body, {new: true}, (error, newDraft) => {
				if (error) {
					let msg = errorMessages.updateDraftError;
					console.log(msg);
					return response.status(500).json({error: msg});
				}
				return response.json({updatedDraft: newDraft});
			});
		}
		else {
			return response.status(500).json({error: msg});
		}
	});
});

app.get("/wsbe/draft", (request, response) => {
	DraftReport.findAll((err, drafts) => {
		if (err) {
			let msg = errorMessages.fetchDraftReportError;
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		return response.json(drafts);
	});
});

app.delete("/wsbe/draft/:id", (request, response) => {
	DraftReport.findByIdAndRemove(ObjectID(request.params["id"]), (err, resp) => {
		if (err) {
			let msg = errorMessages.fetchDraftReportError;
			console.log(msg);
			return response.status(500).json({error: msg});
		}
		return response.json({success: "Draft report deleted successfully"});
	});
});

app.set("port", appPort);
app.listen(app.get("port"), '0.0.0.0', () => {
	console.log("wsbe-api app is running...");
});
