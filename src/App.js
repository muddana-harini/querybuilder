
import React, { useState, useEffect } from 'react';
import {
  QueryBuilder,
  defaultValidator,
  formatQuery,
  isRuleGroup,
} from 'react-querybuilder';
import { CustomRuleGroup } from './CustomRuleGroup';
import 'react-querybuilder/dist/query-builder.css';
import input from './BenefitRulesInput.json';
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { QueryBuilderBootstrap } from "@react-querybuilder/bootstrap";

const inputTypeOptions = [
  { name: 'dropDown1', label: 'Drop Down 1' },
  { name: 'dropDown2', label: 'Drop Down 2' },
  { name: 'dropDown3', label: 'Drop Down 3' },
];

const { fields, operators } = input;

const getOperators = (fieldName) => {
  if (fieldName in operators) {
    return operators[fieldName];
  }
  return [];
};

const combinatorOptions = [
  { name: 'and', label: 'AND' },
  { name: 'or', label: 'OR' },
  { name: 'none', label: 'NONE' },
];

const initialQuery = {
  combinator: 'and',
  rules: [
    { id: '1', field: 'diagnosisCode', operator: 'eq', value: '' },
  ],
};

const App = () => {
  const [query, setQuery] = useState(initialQuery);
  const [savedQuery, setSavedQuery] = useState(initialQuery);
  const [updatedFields, setUpdatedFields] = useState(fields);
  const methods = useForm();
  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = methods;
  const handleQueryChange = (newQuery) => {

    processGroup(newQuery);

    setQuery(newQuery);
  };

  const updateQuery = (currentQuery, updatedGroup) => {
    const recursiveUpdate = (query) => {
      if (!query.rules) {
        query.rules = []; // Ensure rules array exists
      }
  
      if (query.id === updatedGroup.id) {
        return {
          ...query,
          combinator: updatedGroup.combinator || 'AND', // Default to 'AND' if combinator is missing
          rules: updatedGroup.rules || [], // Ensure rules array exists
        };
      }
  
      if (query.rules) {
        return {
          ...query,
          rules: query.rules.map((rule) =>
            isRuleGroup(rule) ? recursiveUpdate(rule) : rule
          ),
        };
      }
  
      return query;
    };
  
    return recursiveUpdate(currentQuery || { id: 'root', combinator: 'AND', rules: [] }); // Default query structure
  };
  const processGroup = (rg) => {
    let hasEmptyRule = false;

    rg.rules.forEach((r) => {
      if (isRuleGroup(r)) {
        if (r.rules.length === 0) {
          hasEmptyRule = true;
        }
        if (!processGroup(r)) {
          hasEmptyRule = true;
        }
      }
      else {
        if (
          (r.value === '' && r.operator !== 'isValidCode' && r.operator !== 'isNotNull') ||
          (r.operator === 'between' && r.value.split(',').some((val) => val.trim() === ''))
        ) {
          hasEmptyRule = true;
        }
      }
    });
    return !hasEmptyRule;
  };


  const handleSaveClick = () => {
    if (!query || !query.rules || query.rules.length === 0) {
      alert('Query is empty. Please add conditions.');
    } else {
      const res = processGroup(query)
      console.log(res)
      if (!res) {
        alert('Text input fields cannot be empty.');
      } else {
        const queryWithDataType = addDataTypeToQuery(query);
        const formattedQuery = formatQuery(queryWithDataType, 'json', {
          dataType: 'dataType',
        });
        console.log("formattedQuery", formattedQuery);
        // Save the query with dataType to the server
        console.log("queryWithDataType", queryWithDataType)
        saveDataToServer(queryWithDataType);
      }
    }
  };


  // Function to add "dataType" to the rules in the query
  const addDataTypeToQuery = (query) => {
    const addDataTypeToRule = (rule) => {
      if (isRuleGroup(rule)) {
        return {
          ...rule,
          rules: rule.rules.map(addDataTypeToRule),
        };
      }

      if (rule.field) {
        const fieldConfig = fields.find((f) => f.name === rule.field);
        if (fieldConfig) {
          // return {
          //   ...rule,
          //   dataType: fieldConfig.datatype,
          // };
          if (rule.field === 'diagnosisCode' && rule.operator === 'isInList') {
            return {
              ...rule,
              dataType: 'episode-diag-code-list',
            };
          } else {
            return {
              ...rule,
              dataType: fieldConfig.datatype,
            };
          }
        }
      }
      return rule;
    };

    const newQuery = { ...query };
    newQuery.rules = newQuery.rules.map(addDataTypeToRule);

    return newQuery;
  };

  const saveDataToServer = (data) => {
    fetch('http://localhost:4001/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then(() => {
        setSavedQuery(data);
        alert('Query saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving query:', error);
      });
  };

  useEffect(() => {
    // Fetch initial data from the server
    fetch('http://localhost:4001/get-data')
      .then((response) => response.json())
      .then((fetchedData) => {
        setQuery(fetchedData);
        setSavedQuery(fetchedData);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  return (
    <div>
      <h1>Benefit Rules</h1>
      <QueryBuilderBootstrap>
      <QueryBuilder
        fields={fields} // Use the original fields without modification
        query={query}
        onQueryChange={handleQueryChange}
        getOperators={getOperators}
        combinators={combinatorOptions}
        validator={defaultValidator}
        resetOnOperatorChange={true}
        controlClassnames={{ queryBuilder: 'queryBuilder-branches' }}

        getValues={(_f, op) =>
          op === 'isInList' ? inputTypeOptions : []
        }
        getValueEditorType={(field, op) => {
          if (op === '>' || op === '<') {
            return null;
          } else if (op === 'isInList') {
            return 'select';
          } else {
            const selectedField = fields.find((f) => f.name === field);
            if (selectedField) {
              return selectedField.inputType || 'text';
            }
            return 'text';
          }
        }}
        controlElements={{
          ruleGroup: (props) => (
            <CustomRuleGroup
              {...props}
              data={{ combinator: props?.combinator || query?.combinator || "AND", }} // Pass initial combinator value
              setValue={setValue} // Pass setValue to update the form state
              onChange={(updatedGroup) => {
                setQuery((prevQuery) => updateQuery(prevQuery, updatedGroup)); // Update the query dynamically
              }}
            />
          ),
        }}
        />
        </QueryBuilderBootstrap>

      <button onClick={handleSaveClick}>Save</button>

      <h4>Query</h4>
      <pre>
        <code>{formatQuery(query, 'json')}</code>
      </pre>
    </div>
  );
};

export default App;

