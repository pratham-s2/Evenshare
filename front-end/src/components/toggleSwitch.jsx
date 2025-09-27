import Switch from 'react-switch';

function ToggleSwitch({isPercentage, setIsPercentage}) {

  return (
    <div className='flex flex-row gap-2 w-max'>
        <p className={`${!isPercentage ? "font-bold text-black" : "text-gray-600"}`}>$</p>
        <Switch
          onChange={() => setIsPercentage(!isPercentage)}
          checked={isPercentage}
          uncheckedIcon={false}
          checkedIcon={false}
          offColor="#60a5fa"
          onColor="#2563eb"
        />

        <p className={`${isPercentage ? "font-bold text-black" : "text-gray-600"}`}>%</p>

    </div>
  );
}

export default ToggleSwitch;
