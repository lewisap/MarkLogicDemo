package org.alewis.database;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.DatabaseClientFactory.Authentication;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.SearchHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.query.MatchDocumentSummary;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StructuredQueryBuilder;

public class Temp {
	
	public void test() {
		// Create a thread-safe connection to the database.
		DatabaseClient client = DatabaseClientFactory.newClient("localhost", 8003, "user", "********", Authentication.DIGEST); 
	
		// Create or update a JSON document
		JSONDocumentManager doc = client.newJSONDocumentManager();
		doc.write("hello.json", new StringHandle("{\"recipient\": \"world\", \"message\": \"Hello, world!\"}"));
	
		// Build up a query and run it
		QueryManager query = client.newQueryManager();
		StructuredQueryBuilder b = query.newStructuredQueryBuilder();
		SearchHandle results = query.search(b.and(b.term("hello"), b.value(b.jsonKey("recipient"), "world")), new SearchHandle());
	
		// Loop through the results and get each document by its unique ID
		for (MatchDocumentSummary summary : results.getMatchResults()) {
			System.out.println(doc.read(summary.getUri(), new StringHandle()).toString());
		}
	}
}

//optHandle.addConstraint(
//optBldr.constraint("companyName",
//		optBldr.value(
//				optBldr.jsonTermIndex("companyName"))));
//
//
////optHandle.withConstraints(
////optBldr.constraint("companyName",
//        optBldr.range(
//                optBldr.elementRangeIndex(
//                        new QName("companyName"),
//                        optBldr.stringRangeType(
//                                "http://marklogic.com/collation/")),
//                Facets.FACETED,
//                FragmentScope.DOCUMENTS,
//                null,
//                "frequency-order", "descending")));
//optHandle.setReturnResults(false);
//optMgr.writeOptions("companies", optHandle);

//// create a manager for JSON documents
////JSONDocumentManager docMgr = client.newJSONDocumentManager();
//for (MatchDocumentSummary docSummary: docSummaries) {
//String uri = docSummary.getUri();
//System.out.println(uri);
//
//// create a handle to receive the document content
////JacksonHandle readHandle = new JacksonHandle();
//
//// read the document content
////docMgr.read(uri, readHandle);
//// access the document content
////JsonNode readDocument = readHandle.get();
//
////logger.debug(readDocument.asText());
////int score = docSummary.getScore();
////
////// iterate over the match locations within a result document
////MatchLocation[] locations = docSummary.getMatchLocations();
////System.out.println("Matched "+locations.length+" locations in "+uri+" with "+score+" score:");
////for (MatchLocation location: locations) {
////// iterate over the snippets at a match location
////for (MatchSnippet snippet : location.getSnippets()) {
////	boolean isHighlighted = snippet.isHighlighted();
////
////	if (isHighlighted)
////		System.out.print("[");
////	System.out.print(snippet.getText());
////	if (isHighlighted)
////		System.out.print("]");
////}
////System.out.println();
////}
//}
//
//// get the full results
////String options = "<search:options xmlns:search='marklogic.com/appservices/search'><transform-results apply=\"raw\"/></search:options>";
////JacksonHandle resultsHandle = new JacksonHandle();
////
////// perform the search
////queryMgr.search(query, resultsHandle);
////
////logger.debug(resultsHandle.toString());
//
////ObjectMapper mapper = new ObjectMapper();
////Person person = mapper.readValue(resultsHandle.get(), Person.class);
////logger.debug(person.toString());
//closeConnection();

