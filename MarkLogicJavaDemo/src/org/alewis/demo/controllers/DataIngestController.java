package org.alewis.demo.controllers;

import java.util.List;
import java.util.Map;

import org.alewis.database.AdminHelper;
import org.alewis.database.SearchHelper;
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
	
	@Autowired private SearchHelper userHelper;
	@Autowired private AdminHelper adminHelper;
	
	/**
	 * 
	 * @param criteria
	 * @param page
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "getPeople")
	public List<MatchDocumentSummary> searchPeople(String criteria, Integer page) throws Exception {
		System.out.println(criteria);
		return userHelper.getAllPeople(criteria, page);
	}
	
	/**
	 * 
	 * @param uri
	 * @throws Exception
	 */
	@RequestMapping(value = "deletePerson", method = RequestMethod.POST)
	public void deletePerson(@RequestBody String uri) throws Exception {
		logger.debug("URI = " + uri);
		userHelper.deletePerson(uri);
	}
	
	@RequestMapping(value = "updatePerson", method = RequestMethod.POST)
	public void updatePerson(@RequestBody Person person) throws Exception {
		logger.debug(person.toString() + " | " + person.getUri());
		userHelper.updatePerson(person.getUri(), person);
	}
	
	@RequestMapping(value = "setQueryOptions", method = RequestMethod.POST)
	public void setQueryOptions() throws Exception {
		adminHelper.setQueryOptions();
		userHelper.showQueryOptions();
	}
	
	@RequestMapping(value = "clearQueryOptions", method = RequestMethod.POST)
	public void clearQueryOptions() throws Exception {
		adminHelper.clearQueryOptions();
		userHelper.showQueryOptions();
	}
	
	@RequestMapping(value = "getCompanies", method = RequestMethod.GET)
	public List<String> getCompanies() throws Exception {
		return userHelper.getCompanyList();
	}
	
	@RequestMapping(value = "getStates", method = RequestMethod.GET)
	public List<String> getStates() throws Exception {
		return userHelper.getStateList();
	}
	
	@RequestMapping(value = "getFacetedResults", method = RequestMethod.GET)
	public Map<String, Object[]> getFacetedResults(String criteria, Integer page) throws Exception {
		return userHelper.getFacetedSearchResults(criteria, page);
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
		return userHelper.getTotalResults(criteria);
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
		return userHelper.retrievePersonAsJSON(uri);
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
		userHelper.writePeople(people);
	}
	
	@SuppressWarnings("unused")
	private void writePerson(Person person) throws JsonProcessingException {
		JSONDocumentManager doc = userHelper.getNewJSONDocumentManager();
		
		// assign the people to the 'people' collection
		DocumentMetadataHandle metadata = new DocumentMetadataHandle();
		metadata.getCollections().addAll("people");
		
		ObjectMapper mapper = new ObjectMapper();
		String json = mapper.writeValueAsString(person);
		logger.info(json);
		
		// Create or update a JSON document
		doc.write("people/" + person.getName().replaceAll("\\s",""), metadata, new StringHandle(json));
		userHelper.closeConnection();
	}
}