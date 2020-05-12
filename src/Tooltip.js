import React from 'react'
import PropTypes from 'prop-types'

export default class Tooltip extends React.Component {

  static propTypes = {
    lat: PropTypes.array.isRequired,
    lng:  PropTypes.array.isRequired
  };

  render() {
    return (
        <div className="tooltip">
            HELLOO
        </div>
    );
  }
}