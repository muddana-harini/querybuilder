



import { memo, useState, useEffect } from 'react';
import {
    RuleGroupBodyComponents,
    RuleGroupHeaderComponents,
    useRuleGroup,
    useStopEventPropagation,
} from 'react-querybuilder';
import ruleGroupPlusIcon from './Assets/Icons/ruleGroupPlusIcon.svg';

export const CustomRuleGroup = memo((props) => {
    console.log(props)
    const rg = useRuleGroup(props);
console.log(rg)
    const addRule = useStopEventPropagation(rg.addRule);
    const addGroup = useStopEventPropagation(rg.addGroup);
    const removeGroup = useStopEventPropagation(rg.removeGroup);
    const shiftGroupUp = useStopEventPropagation(rg.shiftGroupUp);
    const shiftGroupDown = useStopEventPropagation(rg.shiftGroupDown);

    const [selectedCombinator, setSelectedCombinator] = useState(props.data?.combinator?.toUpperCase() || ''); // Initialize with the combinator from props
    const combinators = ['AND', 'OR', 'NONE']; // List of combinators

    // Sync the selected combinator with props.data when it changes
    useEffect(() => {
        if (props.data && props.data.combinator) {
            const combinator = props.data.combinator.toUpperCase();
            if (combinator !== selectedCombinator) {
                setSelectedCombinator(combinator);
            }
        }
    }, [props.data]); // Remove `selectedCombinator` from dependencies


    const handleCombinatorChange = (combinator) => {
        setSelectedCombinator(combinator);

        // Mark form as dirty using React Hook Form's `setValue`
        if (props.setValue) {
            props.setValue(`group-${rg.id}-combinator`, combinator, { shouldDirty: true });
        }

        // Ensure `onChange` is called to update the parent query
        if (props.onChange) {
            props.onChange({
                id: rg.id, // Rule group ID
                combinator, // New combinator value
                rules: rg.rules, // Current rules in the group
            });
        }
    };

    return (
        <div
            ref={rg.previewRef}
            title={rg.accessibleDescription}
            className={rg.outerClassName}
            data-dragmonitorid={rg.dragMonitorId}
            data-dropmonitorid={rg.dropMonitorId}
            data-rule-group-id={rg.id}
            data-level={rg.path.length}
            data-path={JSON.stringify(rg.path)}
        >
            {/* Header Section */}
            <div
                ref={rg.dropRef}
                className={rg.classNames.header}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                {/* Left side: Combinator Button Group */}
                <div className="combinator-container" style={{ display: 'flex', gap: '4px' }}>
                    {combinators.map((combinator) => (
                        <button
                            type="button"
                            key={combinator}
                            onClick={() => handleCombinatorChange(combinator)}
                            className={`combinator-button ${selectedCombinator === combinator ? 'active' : ''}`}
                        >
                            {combinator}
                        </button>
                    ))}
                </div>

                {/* Right side: Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-ruleGroupButton" onClick={addRule}>
                        <img src={ruleGroupPlusIcon} alt="Add Rule Icon" style={{ marginBottom: '3px' }} /> Rule
                    </button>
                    <button className="btn-ruleGroupButton" onClick={addGroup}>
                        <img src={ruleGroupPlusIcon} alt="Add Group Icon" style={{ marginBottom: '3px' }} /> Group
                    </button>
                    <input type="checkbox" className="collapser" defaultChecked={false} />
                </div>
            </div>

            {/* Body Section */}
            <div className={rg.classNames.body}>
                <RuleGroupBodyComponents
                    {...rg}
                    addRule={addRule}
                    addGroup={addGroup}
                    removeGroup={removeGroup}
                    shiftGroupUp={shiftGroupUp}
                    shiftGroupDown={shiftGroupDown}
                />
            </div>
        </div>
    );
});
