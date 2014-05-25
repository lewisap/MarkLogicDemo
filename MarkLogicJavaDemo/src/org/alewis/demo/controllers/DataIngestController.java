package org.alewis.demo.controllers;

import java.util.List;

import org.alewis.database.DatabaseHelper;
import org.alewis.model.Person;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.query.MatchDocumentSummary;

@RestController
public class DataIngestController {
	private static final Logger logger = LoggerFactory.getLogger(DataIngestController.class);
	
	@Autowired private DatabaseHelper dbHelper;
	
	/**
	 * 
	 * @param criteria
	 * @param page
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "getPeople")
	public List<MatchDocumentSummary> searchPeople(String criteria, String companyFilter, String stateFilter, Integer page) throws Exception {
		System.out.println(criteria + " | " + companyFilter + " | " + stateFilter);
		return dbHelper.searchPeople(criteria, companyFilter, stateFilter, page);
	}
	
	/**
	 * 
	 * @param uri
	 * @throws Exception
	 */
	@RequestMapping(value = "deletePerson", method = RequestMethod.POST)
	public void deletePerson(@RequestBody String uri) throws Exception {
		logger.debug("URI = " + uri);
		dbHelper.deletePerson(uri);
	}
	
	@RequestMapping(value = "updatePerson", method = RequestMethod.POST)
	public void updatePerson(@RequestBody Person person) throws Exception {
		logger.debug(person.toString() + " | " + person.getUri());
		dbHelper.updatePerson(person.getUri(), person);
	}
	
	@RequestMapping(value = "setQueryOptions", method = RequestMethod.POST)
	public void setQueryOptions() throws Exception {
		dbHelper.setQueryOptions();
		dbHelper.showQueryOptions();
	}
	
	@RequestMapping(value = "getCompanies", method = RequestMethod.GET)
	public List<String> getCompanies() throws Exception {
		return dbHelper.getCompanyList();
	}
	
	@RequestMapping(value = "getStates", method = RequestMethod.GET)
	public List<String> getStates() throws Exception {
		return dbHelper.getStateList();
	}
	
	/**
	 * 
	 * @param criteria
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "getTotalResults")
	public Long getTotalResults(String criteria) throws Exception {
		logger.debug(criteria);
		return dbHelper.getTotalResults(criteria);
	}
	
	/**
	 * 
	 * @param uri
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "retrievePerson")
	public String retrievePerson(String uri) throws Exception {
		logger.debug(uri);
		return dbHelper.retrievePersonAsJSON(uri);
	}
	
	/**
	 * Controller method to listen for insertPerson, and given an input Person class, write the 
	 * person to the database
	 * 
	 * @param people
	 * @return
	 * @throws Exception 
	 */
	@RequestMapping(value = "insertPerson", method = RequestMethod.POST)
	public void insertPerson(@RequestBody List<Person> people) throws Exception {
		/*
		 * pass in a Person object and tell the controller method that is should
		 * be built from the request body (@RequestBody) - uses Jackson by default if found on classpath
		 */
		dbHelper.writePeople(people);
	}
	
	@SuppressWarnings("unused")
	private void writePerson(Person person) throws JsonProcessingException {
		JSONDocumentManager doc = dbHelper.getNewJSONDocumentManager();
		
		// assign the people to the 'people' collection
		DocumentMetadataHandle metadata = new DocumentMetadataHandle();
		metadata.getCollections().addAll("people");
		
		ObjectMapper mapper = new ObjectMapper();
		String json = mapper.writeValueAsString(person);
		logger.info(json);
		
		// Create or update a JSON document
		doc.write("people/" + person.getName().replaceAll("\\s",""), metadata, new StringHandle(json));
		dbHelper.closeConnection();
	}
}